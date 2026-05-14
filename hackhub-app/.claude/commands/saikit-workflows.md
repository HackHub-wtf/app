---
description: Configure SummonAI Kit workflow integrations, detects tools, asks how the team uses them, installs ops skills + writes a custom dev-cycle playbook. Idempotent.
allowed-tools: AskUserQuestion Bash(summonaikit:*) Read Write Edit
---

# SummonAI Kit, Workflows

You are a thin protocol executor. The `summonaikit` binary holds all the
workflow logic, your only job is to call it in a loop, perform the returned
instruction, and pass the new state back. Don't improvise: never add steps,
never change the question text, never edit the file paths the binary
specifies.

## The loop

1. Run `summonaikit workflow run [--state=<BASE64>] --json` (omit `--state` on
   the very first call). Parse the JSON response.
2. The response is `{ ok: true, data: { instruction: { kind, ... }, nextStateBase64 } }`.
3. Execute the `instruction` per the table below.
4. Re-run step 1 with `--state=<nextStateBase64>` from the previous response.
5. Stop when `instruction.kind === "done"`.

## Instruction kinds

| `kind` | What to do |
|---|---|
| `ask` | Call **AskUserQuestion** with `instruction.question` (it has `question`, `multiSelect`, `options`). Store single-select answers as one string value. Store multi-select answers as a JSON array of selected option values. Then loop. |
| `free-text` | Show `instruction.prompt` to the user in chat as a plain question. Wait for their reply. The reply text is the answer. Then loop. |
| `bash` | Run `instruction.command` via Bash. Surface its stdout to the user (one line is fine). Then loop. |
| `write` | Use **Write** to create the file at `instruction.path` with `instruction.content`. Confirm the path to the user. Then loop. |
| `message` | Show `instruction.text` to the user only if non-empty. Then loop (this is a benign no-op transition). |
| `done` | Display `instruction.summary` to the user as a bullet list and stop. |
| `error` | Show `instruction.message` to the user. If `recoverable: true`, ask if they want to retry, skip, or abort. If `recoverable: false`, stop. |

## State handling

- **First call**: omit `--state` entirely. The binary uses initial state.
- **Every subsequent call**: pass `--state=<nextStateBase64>` from the
  previous response, exactly as returned. The state is opaque, don't
  decode, modify, or interpret it.
- **`done` and `error`** responses don't return a `nextStateBase64`, the
  flow ends.

## Targets

Detect which AI CLIs are configured for this project before the first call:

- `.claude/skills/` exists → `claude` is a target
- `.cursor/skills/` exists → `cursor` is a target
- Default to `claude` if neither is present

Pass `--targets=<csv>` on **every** call (the binary needs it to know where
to install).

## How to encode user answers when calling `run` next

When the previous instruction was `ask` or `free-text`, you collected an
answer. The binary encoded the next state already (in `nextStateBase64`)
before knowing that answer. Here's the rule:

- For `ask`: take the user's selection (string for single-select, array of
  selected values for multi-select). The binary's `nextStateBase64` already
  reflects that this question was asked; you need to merge the answer into
  the state. Decode the base64 → parse JSON → set the value at
  `instruction.storeAt` → re-encode → pass on the next call.
- For `free-text`: same, set the value at `instruction.storeAt`.

`storeAt` paths look like `confirmedToolSelections[ticketing]` or
`answers[stripe][primary_workflow]`. Treat them as bracket-notation paths
into the state object. Create intermediate objects as needed.

## Hard rules

- **Never** invoke `summonaikit` with anything other than `workflow ...`.
- **Never** modify the JSON shape of the state when merging answers, only
  set the value at the specified path.
- **Never** skip a step the binary returns. If the user wants to abort,
  stop the whole loop with a clear "stopped at user request" message.
- **Never** add your own questions, your own files, your own commentary
  beyond surfacing what the binary returned.
- If the binary returns an unknown `kind`, stop and tell the user, it
  means the slash command and binary are out of sync; they need to update.
