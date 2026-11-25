
import argparse
import hashlib
import json
import os
import queue
import re
import subprocess
import sys
import threading
import time

from datetime import datetime
from pathlib import Path


# ==================================================
# 1. GLOBAL CONFIGURATION
# ==================================================

BASE = Path(__file__).resolve().parent
STATE = BASE / "progress.json"


# ==================================================
# 2. FILE AND JSON UTILITIES
# ==================================================

def read_json(path):
    return json.loads(
        path.read_text(encoding="utf-8-sig")
    )


def save_json(path, value):
    tmp = path.with_suffix(".tmp")

    tmp.write_text(
        json.dumps(
            value,
            indent=2,
            ensure_ascii=False
        ),
        encoding="utf-8"
    )

    tmp.replace(path)


def log(message, file=None):

    line = f"[{datetime.now():%H:%M:%S}] {message}"

    print(line, flush=True)

    if file:
        with file.open("a", encoding="utf-8") as f:
            f.write(line + "\n")


# ==================================================
# 3. REALTIME LOGGING
# ==================================================

def run_live(
    command,
    workspace,
    env,
    timeout,
    logfile,
    role
):

    events = queue.Queue()

    stdout = []
    stderr = []

    start = time.monotonic()

    process = subprocess.Popen(
        command,
        cwd=workspace,
        env=env,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1
    )

    def reader(stream, source):

        try:
            for line in stream:
                events.put((source, line))

        finally:
            stream.close()
            events.put((source, None))

    streams = [
        (process.stdout, "stdout"),
        (process.stderr, "stderr")
    ]

    for stream, source in streams:

        threading.Thread(
            target=reader,
            args=(stream, source),
            daemon=True
        ).start()

    ended = 0
    heartbeat = 10

    try:

        while ended < 2 or process.poll() is None:

            elapsed = int(
                time.monotonic() - start
            )

            if elapsed >= timeout:

                raise TimeoutError(
                    f"{role}: timeout after {timeout}s"
                )

            if elapsed >= heartbeat:

                log(
                    f"{role}: process still running "
                    f"| {elapsed}s",
                    logfile
                )

                heartbeat = elapsed + 10

            try:

                source, line = events.get(
                    timeout=1
                )

            except queue.Empty:

                continue

            if line is None:

                ended += 1
                continue

            if source == "stdout":

                stdout.append(line)

            else:

                stderr.append(line)

            log(
                f"[{role}][{source}] "
                f"{line.rstrip()}",
                logfile
            )

        code = process.wait(timeout=10)

    except BaseException:

        if process.poll() is None:

            subprocess.run(
                [
                    "taskkill",
                    "/PID",
                    str(process.pid),
                    "/T",
                    "/F"
                ],
                capture_output=True,
                check=False
            )

        log(
            f"{role}: interrupted",
            logfile
        )

        raise

    duration = int(
        time.monotonic() - start
    )

    log(
        f"{role}: exit={code}, "
        f"duration={duration}s",
        logfile
    )

    output = "".join(stdout).strip()

    if (
        code
        or not output
        or re.search(
            r"^\s*Error:",
            output,
            re.M
        )
    ):

        raise RuntimeError(
            f"{role} failed; inspect {logfile}"
        )

    return output


# ==================================================
# 4. LIMIT REPORT SIZE
# ==================================================

def excerpt(text, limit=4500):

    if len(text) <= limit:
        return text

    return (
        text[:limit // 2]
        + "\n[report excerpt truncated]\n"
        + text[-limit // 2:]
    )


# ==================================================
# 5. EXECUTE AGENT
# ==================================================

def run_agent(
    cfg,
    workspace,
    logdir,
    role,
    task
):

    agent = cfg["agents"][role]

    model = agent.get(
        "model",
        cfg["model"]
    )

    prompt = f"""
Role:
{agent['role']}

Rules:
- Work only inside the local project.
- Never read or print secret values.
- Use local environment configuration.
- Do not access unrelated projects.
- Do not modify AI-Orchestrator.
- Do not deploy applications.
- Do not push to remote Git repositories.
- Do not change operating system settings.
- Do not bypass security controls.
- Do not delete existing user data.
- Preserve existing Docker containers and volumes.
- Use approved dedicated test databases.
- Report actual files modified.
- Report actual commands executed.
- Report actual test evidence.
- Never claim unverified success.
- Keep final report under 3000 characters
  where possible.

Task:
{task}
"""

    if len(prompt.encode("utf-16-le")) // 2 > 22000:

        raise RuntimeError(
            "Prompt too long. "
            "Shorten task or agent reports."
        )

    env = os.environ.copy()

    env["AGENT_PROMPT"] = prompt
    env["AGENT_MODEL"] = model
    env["PYTHONUTF8"] = "1"

    # OpenCode permissions

    permissions = {

        "external_directory": "deny",

        "doom_loop": "deny",

        "edit": {

            "*": "ask",

            "AI-Orchestrator/**": "deny",

            "**/AI-Orchestrator/**": "deny",

            ".env": "deny",

            "**/.env": "deny"
        },

        "bash": "ask"
    }

    if role in (
        "planner",
        "reviewer",
        "tester"
    ):

        permissions["edit"] = "deny"

    if role in (
        "planner",
        "reviewer"
    ):

        permissions["bash"] = "deny"

    env["OPENCODE_PERMISSION"] = json.dumps(
        permissions
    )

    command = [

        "powershell.exe",

        "-NoProfile",

        "-NonInteractive",

        "-Command",

        (
            "[Console]::OutputEncoding = "
            "[System.Text.Encoding]::UTF8; "

            '& opencode run '
            '--model "$env:AGENT_MODEL" '
            '"$env:AGENT_PROMPT"; '

            "exit $LASTEXITCODE"
        )
    ]

    logfile = logdir / (
        f"{datetime.now():%H%M%S_%f}"
        f"_{role}.log"
    )

    log(
        f"{role.upper()} | "
        f"{model} | {logfile.name}"
    )

    return run_live(
        command,
        workspace,
        env,
        cfg["timeout"],
        logfile,
        role.upper()
    )


# ==================================================
# 6. VALIDATE AGENT RESULTS
# ==================================================

def verdict(report):

    lines = [
        line.strip()
        for line in report.splitlines()
        if line.strip()
    ]

    last = lines[-1] if lines else ""

    statuses = {

        "STATUS: PASS": "PASS",

        "STATUS: FAIL": "FAIL",

        "STATUS: BLOCKED": "BLOCKED"
    }

    return statuses.get(
        last,
        "INVALID"
    )


STATUS_RULES = """
End the report with exactly one line:

STATUS: PASS
or
STATUS: FAIL
or
STATUS: BLOCKED

PASS:
All essential phase checks have evidence.

FAIL:
There is a concrete fixable code defect.
List exact changes needed.

BLOCKED:
An essential environment dependency,
permission or credential is unavailable.

Missing folders before their implementation
phase are not blockers.

Optional browser visual verification can be
reported as MANUAL CHECK.

Never claim unverified essential checks passed.
"""


# ==================================================
# 7. MAIN ORCHESTRATOR
# ==================================================

def main(args):

    cfg = read_json(
        BASE / "agents.json"
    )

    phases = read_json(
        BASE / "phases.json"
    )

    requirements = (
        BASE / "task.md"
    ).read_text(
        encoding="utf-8-sig"
    ).strip()

    workspace = Path(
        cfg["workspace"]
    ).resolve()

    if (
        not workspace.is_dir()
        or not requirements
        or not phases
    ):

        raise RuntimeError(
            "Check workspace, task.md "
            "and phases.json."
        )

    # Validate unique phase IDs

    phase_ids = {
        p["id"]
        for p in phases
    }

    if len(phase_ids) != len(phases):

        raise RuntimeError(
            "Duplicate phase IDs."
        )

    # Generate configuration fingerprint

    fingerprint = hashlib.sha256(

        json.dumps(
            [
                str(workspace),
                requirements,
                phases
            ],
            ensure_ascii=False,
            sort_keys=True
        ).encode()

    ).hexdigest()

    # Load or initialize progress

    if STATE.exists():

        state = read_json(STATE)

        if state["fingerprint"] != fingerprint:

            raise RuntimeError(
                "Task or phases changed. "
                "Back up and rename progress.json."
            )

    else:

        state = {

            "fingerprint": fingerprint,

            "phases": {

                p["id"]: {

                    "status": "pending",

                    "repairs": 0
                }

                for p in phases
            }
        }

        save_json(STATE, state)

    # ----------------------------------------------
    # SHOW PROGRESS
    # ----------------------------------------------

    if args.status:

        print("\nAI ORCHESTRATOR V4")
        print("=" * 60)

        for phase in phases:

            entry = state["phases"][
                phase["id"]
            ]

            print(
                f"{phase['id']}: "
                f"{entry['status']} | "
                f"repairs: {entry['repairs']}"
            )

        return 0

    # ----------------------------------------------
    # CHECK DEPENDENCIES
    # ----------------------------------------------

    done = set()

    for phase in phases:

        deps = set(
            phase.get(
                "depends_on",
                []
            )
        )

        if not deps <= done:

            raise RuntimeError(
                "Invalid dependency order: "
                f"{phase['id']}"
            )

        done.add(phase["id"])

    # Find unfinished phases

    pending = [

        phase

        for phase in phases

        if state["phases"][
            phase["id"]
        ]["status"] != "passed"
    ]

    if not pending:

        log(
            "All phases previously passed. "
            "Manual verification is still required."
        )

        return 0

    # ----------------------------------------------
    # RETRY BLOCKED OR FAILED PHASES
    # ----------------------------------------------

    if args.retry:

        for phase in pending:

            entry = state["phases"][
                phase["id"]
            ]

            if entry["status"] in (
                "blocked",
                "failed"
            ):

                for key in list(entry):

                    if key.endswith("_report"):

                        entry.pop(key)

                entry.update(
                    status="pending",
                    repairs=0
                )

        save_json(STATE, state)

    # ----------------------------------------------
    # START WORKFLOW
    # ----------------------------------------------

    print("\n" + "=" * 60)
    print("AI ORCHESTRATOR V4")
    print("=" * 60)

    log(
        f"Workspace: {workspace}"
    )

    log(
        f"Remaining phases: {len(pending)}"
    )

    answer = input(
        "Allow local project work? (y/n): "
    )

    if answer.strip().lower() != "y":

        return 1

    # ----------------------------------------------
    # PROCESS PHASES
    # ----------------------------------------------

    for phase in pending:

        pid = phase["id"]

        s = state["phases"][pid]

        # Skip unresolved blocked phases

        if s["status"] in (
            "blocked",
            "failed"
        ):

            log(
                f"{pid}: {s['status']}; "
                "use --retry after resolving issue."
            )

            continue

        # Check required dependencies

        missing = [

            dependency

            for dependency in phase.get(
                "depends_on",
                []
            )

            if state["phases"][
                dependency
            ]["status"] != "passed"
        ]

        if missing:

            log(
                f"{pid}: waiting for "
                f"{', '.join(missing)}"
            )

            continue

        # Create phase log folder

        logdir = (

            BASE

            / "logs"

            / pid

            / datetime.now().strftime(
                "%Y%m%d_%H%M%S_%f"
            )
        )

        logdir.mkdir(
            parents=True,
            exist_ok=True
        )

        s.update(

            status="running",

            logs=str(logdir)
        )

        save_json(STATE, state)

        print("\n" + "=" * 60)

        log(
            f"PHASE {pid}: "
            f"{phase['name']}"
        )

        print("=" * 60)

        scope = f"""
Overall project context:

{requirements}

Current phase ONLY:

{phase['requirements']}

Required checks:

{phase['checks']}
"""

        # ------------------------------------------
        # EXECUTE AND CACHE AGENT REPORTS
        # ------------------------------------------

        def call(role, task, filename):

            report = run_agent(
                cfg,
                workspace,
                logdir,
                role,
                task
            )

            path = logdir / filename

            path.write_text(
                report,
                encoding="utf-8"
            )

            s[role + "_report"] = str(path)

            save_json(STATE, state)

            return report

        def cached(role):

            path = s.get(
                role + "_report"
            )

            if path and Path(path).is_file():

                return Path(path).read_text(
                    encoding="utf-8"
                )

            return ""

        # ------------------------------------------
        # PLANNER
        # ------------------------------------------

        plan = cached("planner") or call(

            "planner",

            scope + """

Inspect current project files.

Plan this phase only.

Create missing components in the plan.

Do not modify source code.
""",

            "plan.md"
        )

        # ------------------------------------------
        # DEVELOP / TEST / REVIEW LOOP
        # ------------------------------------------

        while True:

            log(
                f"{pid}: attempt "
                f"{s['repairs'] + 1}/"
                f"{cfg['max_repairs'] + 1}"
            )

            feedback = s.get(
                "feedback",
                ""
            )

            # DEVELOPER

            dev = cached("developer") or call(

                "developer",

                scope

                + "\nImplementation plan:\n"

                + excerpt(plan)

                + "\nPrevious findings:\n"

                + excerpt(feedback)

                + """

Implement this phase only.

Create missing source files.

Preserve working code.

Fix concrete reported defects.
""",

                f"developer_{s['repairs']}.md"
            )

            # TESTER

            test = cached("tester") or call(

                "tester",

                scope

                + "\nDeveloper report:\n"

                + excerpt(dev)

                + """

Run actual phase checks.

Do not modify application source.

Report actual command results.
"""

                + STATUS_RULES,

                f"tester_{s['repairs']}.md"
            )

            # REVIEWER

            review = cached("reviewer") or call(

                "reviewer",

                scope

                + "\nDeveloper report:\n"

                + excerpt(dev)

                + "\nTest evidence:\n"

                + excerpt(test)

                + """

Inspect actual source and test evidence.

Do not modify source files.

Do not run terminal commands.
"""

                + STATUS_RULES,

                f"reviewer_{s['repairs']}.md"
            )

            tv = verdict(test)

            rv = verdict(review)

            log(
                f"{pid} | "
                f"TESTER={tv} | "
                f"REVIEWER={rv}"
            )

            # --------------------------------------
            # PASSED
            # --------------------------------------

            if tv == rv == "PASS":

                s["status"] = "passed"

                save_json(STATE, state)

                log(
                    f"{pid}: PASSED"
                )

                break

            # Save feedback

            s["feedback"] = (

                excerpt(test)

                + "\n"

                + excerpt(review)
            )

            # Clear cache before repair

            for role in (
                "developer",
                "tester",
                "reviewer"
            ):

                s.pop(
                    role + "_report",
                    None
                )

            # --------------------------------------
            # BLOCKED
            # --------------------------------------

            if (
                "BLOCKED" in (tv, rv)
                or "INVALID" in (tv, rv)
            ):

                s["status"] = "blocked"

                save_json(STATE, state)

                log(
                    f"{pid}: BLOCKED. "
                    f"See {logdir}"
                )

                log(
                    "Continuing independent phases."
                )

                break

            # --------------------------------------
            # MAXIMUM REPAIRS
            # --------------------------------------

            if (
                s["repairs"]
                >= cfg["max_repairs"]
            ):

                s["status"] = "failed"

                save_json(STATE, state)

                log(
                    f"{pid}: "
                    "maximum repairs reached."
                )

                break

            # --------------------------------------
            # RETRY DEVELOPER
            # --------------------------------------

            s["repairs"] += 1

            save_json(STATE, state)

            log(
                f"{pid}: repair "
                f"{s['repairs']}/"
                f"{cfg['max_repairs']}"
            )

    # ----------------------------------------------
    # FINAL RESULT
    # ----------------------------------------------

    incomplete = [

        phase["id"]

        for phase in phases

        if state["phases"][
            phase["id"]
        ]["status"] != "passed"
    ]

    print("\n" + "=" * 60)
    print("FINAL PROJECT STATUS")
    print("=" * 60)

    for phase in phases:

        entry = state["phases"][
            phase["id"]
        ]

        log(
            f"{phase['id']}: "
            f"{entry['status'].upper()}"
        )

    if incomplete:

        log(
            "Incomplete phases: "
            + ", ".join(incomplete)
        )

        log(
            "Independent available phases processed."
        )

        log(
            "Use --status or --retry."
        )

        return 1

    log(
        "All phases passed according to agents."
    )

    log(
        "Perform manual verification "
        "before relying on the app."
    )

    return 0


# ==================================================
# 8. ENTRY POINT
# ==================================================

if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--status",
        action="store_true"
    )

    parser.add_argument(
        "--retry",
        action="store_true"
    )

    args = parser.parse_args()

    lock = BASE / "run.lock"

    fd = None

    try:

        fd = os.open(

            lock,

            os.O_CREAT

            | os.O_EXCL

            | os.O_WRONLY
        )

        os.write(
            fd,
            str(os.getpid()).encode()
        )

        sys.exit(
            main(args)
        )

    except KeyboardInterrupt:

        log(
            "Stopped by user. "
            "Progress has been saved."
        )

        sys.exit(130)

    except FileExistsError as error:

        log(
            f"File exists: {error}"
        )

        log(
            "Check whether another orchestrator "
            "is running."
        )

        sys.exit(1)

    except Exception as error:

        log(
            f"ERROR: {error}. "
            "Saved progress can be resumed."
        )

        sys.exit(1)

    finally:

        if fd is not None:

            os.close(fd)

            lock.unlink(
                missing_ok=True
            )
