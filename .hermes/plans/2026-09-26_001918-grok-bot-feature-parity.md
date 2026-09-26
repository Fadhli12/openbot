# Comprehensive Master Implementation Plan: Complete Grok Bot Parity for OpenBot

> **For OpenBot & Hermes Agent:** Definitive blueprint to achieve 100% complete feature parity with Grok Bot (X Corp. / Anysphere) on OpenBot.

**Goal:** Transform OpenBot into a full-featured, autonomous AI coworker platform matching and exceeding Grok Bot:
1. **8 Grok Bot Specialized Coworkers** (Sales Outbound, Talent Scout, Inbox Manager, Expense Manager, Invoice Collector, Account Health, Bug QA, Competitive Intel).
2. **Persistent Web Sandboxes** ("Log in once, works across your tools and websites").
3. **"Show Once $\rightarrow$ Save as Routine"** (Turn completed workflows into automated 24/7 cron routines).
4. **Human-in-the-Loop Action Approvals** ("Stay in the loop only when something needs your yes").
5. **Multi-Agent Coordination & Coordinator Promotion** ("Promote one to coordinate when you need a single update").
6. **24/7 Unattended Execution & Overnight Activity Digest** ("Keeps going even after you close your laptop").
7. **Voice Mode & Audio Interaction** (Voice chat and speech interaction on desktop & mobile).
8. **Mobile / iOS PWA Experience** ("Message an AI coworker from iPhone or desktop").

---

## 1. Complete Grok Bot Feature Parity Matrix

| Grok Bot Capability | Grok Bot Specification | OpenBot Implementation |
| :--- | :--- | :--- |
| **1. 8 Specialist Workflows** | Sales Outbound, Talent Scout, Inbox, Expense, Invoice, Account Health, Bug QA, Competitive Intel. | Built-in tenant personas in `examples/fintech/agents.yaml`, DB seeding, and domain skill packages in `skills.yaml`. |
| **2. Persistent Web Sessions** | Log in once to CRMs, vendor portals, ad tools; persistent browser state. | Persistent Chromium user-data profiles (`~/.openbot/profiles/<botId>`), cookie preservation, and credential vault. |
| **3. Show Once $\rightarrow$ Save as Routine** | Walk through a task once, save as a routine, runs automatically next time. | Conversational routine generator (`create_routine_from_task`) + 1-click **"Save as Routine"** UI action chip and dialog. |
| **4. Human-in-the-Loop Approval** | Autonomous multi-step execution, pauses only for your "YES" on sensitive actions. | High-visibility **Action Approval Card** in chat transcript: Diff/Action preview $\rightarrow$ Approve / Deny / Take the Wheel. |
| **5. Promote to Coordinator** | Multiple bots collaborate in a thread; promote one to synthesize updates. | Group channel role selector: promote any member to **Lead Coordinator & Synthesizer** (single consolidated briefing). |
| **6. 24/7 Background & Morning Digest** | Unattended background runs; activity summaries while away. | LaunchAgent background execution + **"While You Were Away" / Activity Digest** panel summarizing overnight routine runs. |
| **7. Voice Chat Mode** | Fast voice chat mode from mobile or desktop. | Integrated Web Speech API audio transcription + TTS audio player with floating Voice Bar in composer. |
| **8. Mobile-First PWA Experience** | iOS native app look-and-feel with seamless cross-device syncing. | Standalone PWA manifest, iOS viewport meta tags, bottom nav bar for mobile, and touch-to-click canvas controls. |

---

## 2. Detailed Task Breakdown & Architecture

### Phase 1: The 8 Grok Bot Specialist Coworkers & Skill Suites

#### Task 1.1: Define All 8 Specialists in `agents.yaml`
**Objective:** Add complete standing personas, guidelines, and tool bindings for all 8 Grok Bot specializations.
**Files:**
- Modify: `examples/fintech/agents.yaml`
- Modify: `server/src/tenant-package.ts`
**Coworkers to Add:**
1. `sales-outbound`:
   - Role: Prospect research, email outreach drafting, CRM staging. Strict rule: never send without approval.
2. `talent-scout`:
   - Role: Candidate discovery, ATS/criteria filtering, personalized LinkedIn message drafting.
3. `inbox-manager`:
   - Role: Email triage, urgency classification, draft replies. Strict rule: never send without approval.
4. `expense-manager`:
   - Role: Receipt extraction, expense coding, missing item follow-up across internal portals.
5. `invoice-collector`:
   - Role: Automated vendor portal navigation, invoice PDF downloading, staging for accounting review.
6. `account-health`:
   - Role: Account digest generation, churn risk detection, and proactive follow-up recommendations.
7. `bug-reproduction`:
   - Role: Web app navigation, bug reproduction, DOM/network snapshot logging, and structured bug report generation.
8. `competitive-intel`:
   - Role: Competitor site monitoring, pricing page tracking, product update diffs.

#### Task 1.2: Specialized Skill Packages in `skills.yaml`
**Objective:** Provide executable procedures and instructions for each of the 8 roles.
**Files:**
- Modify: `examples/fintech/skills.yaml`
- Modify: `server/src/plugins/catalogue.ts`

---

### Phase 2: "Show Once $\rightarrow$ Save as Routine" Workflow

#### Task 2.1: Conversation-to-Routine Engine
**Objective:** Enable agents to extract completed workflows into reusable cron routines.
**Files:**
- Create: `server/src/routines/workflow-extractor.ts`
- Modify: `server/src/plugins/builtin-routines.ts`
- Modify: `server/src/routines/routes.ts`
**Details:**
- Endpoint `POST /api/routines/from-workflow`: takes `threadId`, generates standardized routine prompt, schedule, and timezone.
- Tool `save_as_routine`: allows bot to propose: *"I've completed this task. Would you like me to schedule this as a routine to run every weekday at 9 AM?"*

#### Task 2.2: Interactive "Save as Routine" UI Component
**Objective:** Add a 1-click button at the bottom of agent responses to convert actions to routines.
**Files:**
- Create: `app/src/components/routines/save-routine-dialog.tsx`
- Modify: `app/src/components/channels/chat-transcript.tsx`
**Details:**
- Action pill `[⏱ Save as Routine]` on finished assistant messages.
- Opens dialog with schedule picker (Hourly, Daily, Weekdays, Custom Cron), target channel, and editable instruction.

---

### Phase 3: Human-in-the-Loop "Only When Something Needs Your YES"

#### Task 3.1: Interactive Action Approval Cards in Chat
**Objective:** Halt execution before critical actions (external emails, DB deletes, purchases) and present an interactive decision card.
**Files:**
- Create: `app/src/components/channels/action-approval-card.tsx`
- Modify: `app/src/components/channels/chat-transcript.tsx`
- Modify: `server/src/computer/gateway.ts`
**Details:**
- Card shows:
  - ⚠️ Action Summary: e.g. "Send email to client@example.com" or "Download 4 invoices from portal".
  - Payload preview (subject, body, parameters).
  - 3 Action Buttons:
    1. **"Approve & Send"** (green)
    2. **"Reject / Cancel"** (red)
    3. **"Take the Wheel"** (opens live browser screen to do it manually).

---

### Phase 4: Multi-Agent Group Coordination & "Promote to Coordinator"

#### Task 4.1: Coordinator Role Designation
**Objective:** Allow any agent in a multi-agent group to be designated as the Lead Coordinator.
**Files:**
- Modify: `server/src/copilot.ts` (`GroupRoundRobinAgent`)
- Modify: `app/src/components/channels/group-channel-profile.tsx`
- Modify: `app/src/components/channels/create-group-dialog.tsx`
**Details:**
- In group settings, add: **Lead Coordinator** dropdown.
- When set, the Lead Coordinator compiles the final executive briefing, tracks consensus, and presents a single unified update to the user.

---

### Phase 5: Voice Chat Mode (Hands-Free Coworker Audio)

#### Task 5.1: Voice Input & Transcription (Speech-to-Text)
**Objective:** Allow talking to any AI coworker directly via voice.
**Files:**
- Create: `app/src/components/channels/voice-chat-button.tsx`
- Modify: `app/src/components/channels/composer/composer.tsx`
**Details:**
- Microphone toggle button in composer: uses browser Web Speech API / Audio Recording.
- Live speech transcription injected directly into composer draft.

#### Task 5.2: Text-to-Speech Coworker Response (Voice Output)
**Objective:** Allow agents to speak their answers aloud.
**Files:**
- Create: `app/src/components/channels/audio-player-bubble.tsx`
- Modify: `app/src/components/channels/chat-transcript.tsx`
**Details:**
- Audio button on agent messages: plays speech synthesis using Web Speech API or local TTS engine.
- Hands-free continuous voice chat toggle.

---

### Phase 6: 24/7 Overnight Execution & Activity Digest

#### Task 6.1: "While You Were Away" / Activity Digest Panel
**Objective:** Show a clean summary of what bots completed while the user was offline or had their laptop closed.
**Files:**
- Create: `app/src/components/routines/activity-digest-dialog.tsx`
- Modify: `app/src/components/app-sidebar/app-sidebar.tsx`
- Modify: `server/src/routines/routes.ts`
**Details:**
- Displays runs from the last 24 hours:
  - Invoices collected, emails triaged, competitor changes detected, QA runs executed.
  - Quick link to the channel/thread of each run.

---

### Phase 7: Mobile-First PWA & Touch Screen Control

#### Task 7.1: Mobile Navigation Bar & Viewport Adaptation
**Objective:** Seamless iOS / Android mobile experience.
**Files:**
- Create: `app/src/components/layout/mobile-bottom-nav.tsx`
- Modify: `app/src/routes/_authed/_app.tsx`
- Modify: `app/index.html` (PWA meta tags, viewport fit=cover, apple-touch-icon)
- Create: `app/public/manifest.json`

#### Task 7.2: Touch-to-Click Remote Screen Control
**Objective:** Full remote control of browser sessions on touchscreens ("Take the Wheel" on iPhone/iPad).
**Files:**
- Modify: `app/src/components/computer/live-screen.tsx`
**Details:**
- Touch coordinate mapping to remote Chromium clicks and scrolls.
- Touch action toolbar (Esc, Tab, Enter, Backspace, Input text dialog).

---

### Phase 8: Verification, Integration & Deployment

#### Task 8.1: Full Stack Typecheck & Build
- `cd server && bun run typecheck`
- `cd app && bun run typecheck`
- Verify DB migrations & sync tenant packages.

#### Task 8.2: Live Testing
- Test voice chat on desktop & mobile browser.
- Test 1-click "Save as Routine".
- Test multi-agent coordinator synthesis.
- Test action approval gate.
