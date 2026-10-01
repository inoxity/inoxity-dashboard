# Frequently asked questions

## About Inoxity

### What is Inoxity?

An open-source research platform for running iPhone studies in everyday life. Researchers configure a study in the [Researcher Dashboard](https://www.inoxity.org). Participants join by entering the study's code in the Inoxity iPhone app. A study can collect selected Apple Health data, send scheduled surveys and reminders, and accept photo and video uploads. See [How Inoxity fits together](getting-started/overview.md).

### Is Inoxity ready to use?

Inoxity is undergoing active development and large-scale validation, and will be ready for use soon. [Join the mailing list](https://www.inoxity.org/updates) to hear when it launches, or email Rachael Kee at [rlkee@ucdavis.edu](mailto:rlkee@ucdavis.edu) for early access.

### Do I need to know how to code?

No. Studies are set up in the dashboard's step-by-step wizard. The one technical step is creating your study's Supabase project and pasting in the two setup files the dashboard generates for you. See [Supabase setup](administration/supabase-setup.md).

### Does Inoxity work on Android?

No. The participant app is for iPhone (iOS 17 or later). Apple Watch data is collected through Apple Health. See [Before you start](getting-started/before-you-start.md#3-devices).

### Is Inoxity open source?

Yes, under the BSD 3-Clause License. The code is on GitHub in [inoxity-dashboard](https://github.com/inoxity/inoxity-dashboard) and [inoxity-app](https://github.com/inoxity/inoxity-app). See [About the team](about.md).

## Data and security

### Can the Inoxity team see my participants' data?

No. Each study's participant data goes directly from the participant's iPhone to the Supabase project your team owns. It never passes through Inoxity's servers, and the dashboard has no way to read it. See [Data overview](data/overview.md) and [Accessing study data](data/data-access.md).

### Who is responsible for my study database's security?

Your team is. The dashboard generates a security file as a starting template, but the Inoxity team does not provide or take responsibility for the security of your study's database. Adapt it to your study's data sensitivity, regulatory requirements (e.g., IRB, HIPAA), and institutional policies. See [Supabase setup](administration/supabase-setup.md) and [Security architecture](data/security.md).

### Where do survey answers go?

To your survey platform. Inoxity opens your survey links and records when each survey was opened and completed, but the answers themselves stay wherever the survey is hosted. See [Tracking survey completion](studies/survey-completion-tracking.md).

### How do I get my data?

From your study's own Supabase project: its tables hold enrollments, survey events, Apple Health samples, and media. The dashboard doesn't export participant data. See [Accessing study data](data/data-access.md).

### Can I use one Supabase project for several studies?

No. Each study needs its own, new Supabase project. See [How Inoxity fits together](getting-started/overview.md#important-boundaries).

## Running a study

### Why won't my study code enroll anyone?

The study page's **Ready to activate?** checklist and the **Activate** button check the study the same way the app does when a participant enrolls. They list anything that would stop enrollment, such as an end date that has passed, an impossible date, or a Data Backend that doesn't match. If a participant still sees an error, look up its code (E01–E99) in [Troubleshooting](troubleshooting.md).

### Can I change a study after it's active?

Yes, but carefully. Text and schedule changes reach participants' apps automatically. Adding features such as a new Apple Health data type may also need changes to your Supabase project. See [Study configuration](studies/study-configuration.md#editing-an-active-study).

### What happens when a participant withdraws?

The app sends the withdrawal to your Study Backend. Depending on the participant's choice, their data is kept or deleted. See [Withdrawal](participant-experience/withdrawal.md).

## Still have questions?

Email [inoxity.team@gmail.com](mailto:inoxity.team@gmail.com) for support with a running study, or Rachael Kee at [rlkee@ucdavis.edu](mailto:rlkee@ucdavis.edu) about using Inoxity or collaborating.
