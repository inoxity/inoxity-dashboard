# Before you start

Inoxity lets you run an iPhone study without writing code, but a successful study still takes planning. This page covers what you'll need and what to decide before you create your first study. When you're ready, follow the [Researcher workflow](researcher-workflow.md).

!!! note "Current status"
    Inoxity is undergoing active development and large-scale validation, and will be ready for use soon. [Join the mailing list](https://www.inoxity.org/updates) to hear when it launches, or email Rachael Kee at [rlkee@ucdavis.edu](mailto:rlkee@ucdavis.edu) for early access.

## 1. Approvals and study materials

Inoxity does not replace your research protocol, consent process, IRB or ethics review, data-governance plan, or institutional security review. Before you configure a study, have your approved materials ready:

- participant-facing names, welcome text, and messages;
- the Apple Health data types you'll request, and the reason participants will see for each permission;
- links to your surveys (Inoxity opens surveys hosted elsewhere and records when they're opened and completed; the answers stay in your survey platform);
- survey and reminder schedules;
- a support contact for participants;
- the format of the participant identifier you'll ask for (for example, a SONA ID).

Only request data that your protocol, consent, and approvals cover. A data type being available in Inoxity is not permission to collect it.

## 2. Where your study's data lives, and who secures it

Inoxity keeps study management and participant data apart:

- The **Researcher Dashboard** (inoxity.org) stores your study's settings. It never holds participant data.
- Each study gets its own **Study Backend**: a Supabase project that **your team** creates, owns, and controls. Everything participants submit goes straight from their iPhone to that project.

So before you can activate a study, your team needs a new Supabase project, used only for that study. The dashboard generates two setup files for it: one for the database structure and one for security.

!!! warning "You're responsible for your database's security"
    The Inoxity team does not provide or take responsibility for the security of your study's database. The security file is a starting template to adapt to your study-specific and institutional policies, including data sensitivity, regulatory compliance (e.g., IRB, HIPAA), and ethical guidelines. Your team also owns access control, exports, retention, and backups for that project.

Read more in [How Inoxity fits together](overview.md), [Supabase setup](../administration/supabase-setup.md), and [Security architecture](../data/security.md).

## 3. Devices

- **Participants** need an iPhone running iOS 17 or later. There is no Android version. Apple Watch data reaches Inoxity through Apple Health, so participants who wear one don't install anything extra on it.
- **Your team** should test the study end to end on a physical iPhone before launch. Apple Health access and notifications don't behave realistically in a simulator.

## 4. Accounts

- A **researcher account** on the dashboard, with a confirmed email address. You can browse and edit studies before confirming, but you can't activate one until your email is confirmed.
- Collaborators each need their own account; invite them from **Research Team** with the right role (Admin, Editor, or Viewer). See [Managing a team](managing-a-team.md).
- A **Supabase account** for your team, to create each study's project.

## 5. Plan your timeline

A typical order:

1. Get your protocol and materials approved.
2. [Create your account](creating-an-account.md) and [a draft study](creating-a-study.md).
3. Create the study's Supabase project, run the two setup files, and link it on the **Data Backend** step. Use **Test connection** to check it.
4. Use the **Ready to activate?** checklist to fix anything the app would reject.
5. Pilot the study yourself on a physical iPhone, with a test participant ID.
6. Activate the study and share its code with participants.

Changing a study after participants have enrolled is possible, but some changes (such as adding an Apple Health data type) also need database changes. Settle the design before launch where you can. See [Study configuration](../studies/study-configuration.md#editing-an-active-study).
