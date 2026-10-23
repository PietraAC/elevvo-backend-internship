# Internship Task Project Standards

## 1. Purpose

These standards apply to every task repository created for the internship. Each
task must be independently understandable, runnable, testable, and presentable
without relying on undocumented context from another repository.

## 2. Language

- All repository content must be written in English.
- This includes README files, documentation, source code identifiers, comments,
  logs, error messages, test names, seed data, user-facing labels, diagrams, and
  examples.
- Non-English content is allowed only when a task explicitly requires a
  multilingual test case. Such content must be isolated as test data and must
  not replace English documentation or internal naming.

## 3. Repository independence

- Each task lives in its own top-level `task-XX-*` directory and can become an
  independent Git repository.
- A task must not import source files from another task directory.
- Reused ideas may be reimplemented or extracted later, but every repository
  must build and run from a clean clone using only its documented dependencies.
- Every service, container, volume, and host port must use a task-specific name
  or port so that accidental cross-task interference is avoided.

## 4. Required documentation

Every task repository must contain:

- `README.md` with purpose, architecture summary, prerequisites, quick start,
  commands, API or usage examples, testing instructions, and limitations;
- a detailed implementation specification under `docs/`;
- an architecture diagram or an equivalent visual explanation;
- a requirement-to-evidence traceability table;
- an `.env.example` containing safe placeholders only;
- a short evidence guide explaining what to capture for the final submission.

Documentation must describe implemented behavior honestly. Planned behavior
must be explicitly labeled as planned until it exists.

## 5. Windows task launcher

Every task must provide a project-local `task.bat`. Opening it without arguments
must display a menu. The command-line interface should expose, when applicable:

```text
task.bat run
task.bat demo
task.bat test
task.bat verify
task.bat seed
task.bat stop
task.bat help
```

The launcher must operate only on its own project. It must not stop containers,
delete data, or kill processes that belong to another task.

## 6. Demonstration and screenshot requirement

Every completed task must provide a functional, screenshot-ready artifact. A
full frontend is not required.

Acceptable artifacts include:

- a small read-only demonstration page served by the backend;
- an OpenAPI or API explorer page with meaningful live responses;
- a generated benchmark, test, or architecture report;
- a polished terminal demonstration with deterministic output;
- a dashboard endpoint that visualizes the task's main behavior.

The artifact must:

- demonstrate the core requirement rather than only show that the server is up;
- use deterministic seed data and English labels;
- avoid secrets, personal data, machine-specific paths, and noisy debug output;
- show enough context to be understood in a LinkedIn image without a long
  explanation;
- be reproducible through `task.bat demo` or a clearly documented command.

Each repository should reserve `docs/evidence/` for final screenshots and small
generated reports. Large runtime files, model caches, databases, and secrets
must remain ignored by Git.

## 7. Quality baseline

A task is complete only when:

- installation is lockfile-based and reproducible;
- strict TypeScript checking passes when TypeScript is used;
- automated tests cover the main success and failure paths;
- the production build passes;
- the documented quick start works from a clean environment;
- runtime errors use stable, safe error responses;
- no secret is committed or printed;
- the evidence artifact is generated from the real implementation;
- `task.bat verify` returns a non-zero exit code when a quality check fails.

## 8. README presentation baseline

The final README should be portfolio-ready and follow this order:

1. project title and one-sentence outcome;
2. final demonstration image or GIF;
3. problem and solution;
4. architecture diagram;
5. technology decisions;
6. quick start;
7. API or usage examples;
8. testing and performance evidence;
9. limitations and future work;
10. source task requirements and acknowledgements.

