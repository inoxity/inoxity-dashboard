# Tracking survey completion

Inoxity always knows when a participant **starts** a survey, because the app opens it. It only knows when they **finish** if the survey tool sends them back to the app at the end. This page explains how that works and how to set it up in Qualtrics.

## How it works

1. The participant taps **Take Survey**. The app opens your survey link with four values added to the end:

    | Link parameter | What it is |
    |---|---|
    | `inoxity_study_id` | The study's stable ID |
    | `inoxity_survey_id` | The survey's ID from the dashboard |
    | `inoxity_occurrence_id` | This specific scheduled survey (for example, Tuesday's 2:14 PM survey) |
    | `inoxity_callback_url` | A return link that reopens the Inoxity app, e.g. `inoxity://survey-complete?…` |

2. The app records an **opened** event.
3. At the end of the survey, the survey tool redirects to `inoxity_callback_url`. iOS asks the participant **"Open in Inoxity?"**, and when they tap **Open**, the app records a **completed** event.

Both events are uploaded to the study's `survey_events` table (`event_type` is `opened` or `completed`), along with the occurrence ID and its scheduled time.

!!! warning "Without the redirect, nothing is marked completed"
    If **Track completion** is on but the survey tool isn't set up to redirect, the app never learns the survey was finished. The survey stays **Started** on the participant's phone, shows as **Expired** once its window closes, and your data only has an `opened` event for it. The responses themselves are still saved in your survey tool.

## Turn it on in the dashboard

In the study wizard's **Surveys** step, make sure **Track completion (survey redirects back to Inoxity)** is on for the survey. It's on by default. When it's on, the form shows a **How to set this up in Qualtrics** panel with the values below, copy buttons, and a ready-made test link for that survey.

Turn it off only if your survey tool can't redirect to a URL at the end. With it off, the app treats starting a survey as doing it: once the window closes, a started survey shows as **Done** on the participant's phone instead of **Expired**, and doesn't count as missed. Your data still only has `opened` events for it.

## Set up Qualtrics

Do this once for each survey.

1. **Declare the fields.** Open **Survey flow** and click **Add a New Element Here → Embedded Data**. Move the element to the **very top**, above all questions. Add these four fields, exactly as written, and leave their values blank:

    ```
    inoxity_callback_url
    inoxity_occurrence_id
    inoxity_survey_id
    inoxity_study_id
    ```

    Qualtrics fills them in from the survey link automatically. Click **Apply**.

2. **Redirect at the end.** Open **Survey options → End of survey** (or the **End of Survey** element in the survey flow), choose **Redirect to a URL**, and enter:

    ```
    ${e://Field/inoxity_callback_url}
    ```

3. **Publish** the survey. Qualtrics only uses published changes.

!!! tip "Linking answers to Inoxity data"
    Because of step 1, every Qualtrics response carries `inoxity_occurrence_id`. It matches `occurrence_id` in the study's `survey_events` table, so you can join each set of answers to the participant and the exact scheduled survey it belongs to.

### Other survey tools

Any survey tool works if it can (a) save values passed in the survey link and (b) redirect to a URL built from one of those values when the survey ends. Set it up to redirect to the value of the `inoxity_callback_url` link parameter.

## Test it in a browser

You can check the survey tool's setup without the app, a study database, or an enrolled participant.

1. Build a test link. The dashboard's setup panel generates one for you. To build it by hand, add this to the end of your survey link (use `&` instead of the first `?` if the link already contains a `?`):

    ```
    ?inoxity_study_id=test-study&inoxity_survey_id=test-survey&inoxity_occurrence_id=test-occurrence-1&inoxity_callback_url=https%3A%2F%2Fexample.com%2Fsurvey-done
    ```

    This uses a normal web page, `example.com/survey-done`, in place of the app's return link, so you can see the redirect in any browser.

2. Open the link and finish the survey.
3. **Check the redirect:** you should land on `example.com/survey-done`.
4. **Check the saved values:** in **Data & Analysis**, your test response should show `inoxity_occurrence_id` = `test-occurrence-1` and the other three fields.
5. Delete the test response so it doesn't mix with real data.

Before launching a study, also test once end to end on a physical iPhone: take a survey from the app, tap **Open** when iOS asks, and check that the survey shows as **Completed**.

## Troubleshooting

| What you see | Likely cause |
|---|---|
| The test ends on Qualtrics' usual "thank you" page, not `example.com/survey-done` | The end-of-survey redirect isn't set, or the survey wasn't published after setting it. |
| The four `inoxity_…` columns are blank or missing in the response | The Embedded Data element is missing, isn't at the top of the survey flow, or a field name is misspelled. |
| The browser test works, but surveys in the app stay **Started** | **Track completion** is off for that survey in the dashboard, or the participant didn't tap **Open** when iOS asked. |
| Only some completions appear in the data | Participants closed the survey before reaching the end, so the redirect never ran. |
