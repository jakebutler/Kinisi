# Kinisi v2 Frontend design

## General user flow
Once a user has created an account and confirmed their email address, they will start onboarding with Kinisi. This is an on-the-rails experience where they have to move through the onboarding flow until they've completed it, and then they'll see a dashboard with some navigation to other pages.

## Onboarding Steps
There are 4 steps to the onboarding flow: Complete intake survey -> Review + approve personalized assessment -> Review + approve custom fitness program -> Generate schedule + calendar events for custom fitness program.
Start: User signs in to Kinisi for first time after confirming their email address.
1. User completes intake survey and submits responses.
2. Personalized assessment is generated and presented to user for approval.
    2a. User can choose to request updates to their personalized assessment.
    2b. When user is happy with personalized assessment, they will approve it.
3. Custom fitness program is generated and presented to user for approval.
    3a. User can choose to request updates to their custom fitness program.
    3b. When user is happy with their custom fitness program, they will approve it.
4. Start date for program is set and calendar events are scheduled + created for each session in  the custom fitness program.
    4a. Once the user sets a start date, the calendar events for the fitness program sessions are generated and scheduled.
    4b. The user may request or make updates to the schedule and calendar events themselves.

Once the user sets a start for their program and the fitness program sessions are generated, their user status will be changed from Onboarding to Active. The user does not need to approve the generated sessions.

## Onboarding UI
- There will be a header with the Kinisi icon in the top left, the logged in username in the top right, with a sign out link.
- Beneath the header will be an onboarding progress tracker that has 4 circles with numbers 1-4 in each. These circles are connected by a horizontal line between 1 and 2, 2 and 3, 3 and 4. 
- Once a user completes an onboarding step, that numbered circle will change to have a checkmark in the middle. 
- The circle representing the onboarding step the user is currently on will be identified in the UI.
- Beneath the onboarding progress tracker will be the main interaction area for the user. This is where they'll complete the intake survey, review + approve their personalized assessment, review + approve their custom fitness program, and set the start to schedule the calendar events for their first kinisi fitness program.

## Personalized Assessment UI
- The user's personalized assessment is automatically generated when they submit their intake survey responses for the first time, when the user requests updates to their personalized assessment, or when the user updates their intake survey responses and indicates they also want their personalized assessment updated.
- The personalized assessment starts in a Draft state, and moves to Approved once the user approves it.
- While the personalized assessment is in draft state, the user will be shown the assessment itself with 2 CTAs below it: Approve, Request Updates.
- If the user clicks Approve, the status is changes to Approved and the Approve button changes to italic text that says "Approved". The user can still click/tap "Request Updates" from here if their status is Active. If the user is onboarding, they will automatically move to the next onboarding step when they click Approve.
- If the user clicks/taps "Request Updates", a text entry box appears below the personalized assessment content. This text entry box has placeholder text "Type your request here". 
- When the user changes to this view to request an update to their personalized assessment, the Approve button changes to a Submit button and the Request Update button changes to a cancel button. 
- When the user has submitted a request to update their personalized program, the program will be updated and its status changed to Draft.
- When the user approves a draft after they are Active, they will be asked if they want to also update their current fitness program, start a new one, or continue with doing nothing.

## Custom Fitness Program UI
- The user's custom fitness program is automatically generated when they approve their personalized assessment for the first time, when the user requests updates to their custom fitness program, or when the user updates + approves their personalized assessment and indicates they also want their personalized assessment updated.
- The custom fitness program starts in a Draft state, and moves to Approved once the user approves it.
- While the custom fitness program is in draft state, the user will be shown the full custom fitness program details with 2 CTAs below it: Approve, Request Updates.
- The custom fitness program will be separated into weeks (e.g. Week 1, Week 2, etc.), that will have 1 or more sessions each (e.g. Session 1, Session 2) etc. Each week and each session will have a goal. Each session will also have a list of exercises. This view will have the full details of each exercise available behind a expand/collapse "Full Details" link that is collapsed by default. 
- The user will be shown the exercise name, sets + reps,duration (depending on the type of exercise) be default. All other exercise information (e.g. target muscles, secondary muscles, instructions, etc.) will be hidden behind the expand/collapse link.
- If the user clicks Approve, the status is changes to Approved and the Approve button changes to italic text that says "Approved". The user can still click/tap "Request Updates" from here if their status is Active. If the user is onboarding, they will automatically move to the next onboarding step when they click Approve.
- If the user clicks/taps "Request Updates", a text entry box appears below the custom fitness program content. This text entry box has placeholder text "Type your request here". 
- When the user changes to this view to request an update to their custom fitness program, the Approve button changes to a Submit button and the Request Update button changes to a cancel button. 
- When the user has submitted a request to update their personalized program, the program will be updated and its status changed to Draft.

## Active user UX
Active users will see the same header as onboarding users that shows the logo in the top left, the username in the top right with a link to sign out.
Once a user becomes active, they will have a 3 pages they can navigate between:
1. **Fitness program + schedule** - this screen will have the complete details of the fitness program, including all of the sessions, exercises in each session, exercise details like description, instructions, link to video, etc., as well as session calendar details like date/time, goal of the session, etc. This screen will also have a calendar view showing all the sessions scheduled. The user will can request updates to their fitness program or schedule from this screen, and they can update calendar events directly themselves. 
2. **Personalized assessment** - this screen will show the personalized that was generated from the user's intake survey responses. The user can request updates to their personalized assessment from this screen. When the user's personalized assessment is updated, they'll be asked if they want to update the remaining sessions in their current program, start a new program with the updated assessment, or continue on their current program with no updates. Depending the user's selection, they will be taken to the relevant screen and relevant flow will start (e.g. if they select to start a new program with the updated assessment, they'll be taken to the Fitness program + schedule screen and be prompted to set a start date for the new program).
3. **Intake survey** - on this screen the user can see all of their responses to the intake survey and update any responses they choose to. When the user updates their responses, they will be asked if they want to also update their personalized assessment. If they select Yes, a new personalized assessment will automatically be generated and they'll automatically be taken to the personalized assessment screen to view the new draft.