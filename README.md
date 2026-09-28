# A2Z-DSA Tracker 🚀

## Version 3 — durable local progress

Version 3 makes IndexedDB the primary store for tracker and Planly progress.
On its first load it copies valid Version 2 data from `A2Z_Archive` and
`A2Z_Planly_v2` without deleting either key. Every later change is also kept in
those keys as a compatibility copy, so returning to Version 2 retains the
latest progress.

- Tracker and Planly state are committed together through a serialized save
  queue, with stale cross-tab writes rejected by IndexedDB.
- A pending compatibility copy repairs IndexedDB after an interrupted write.
- Sheet updates restore completion, bookmarks, and notes by stable question ID
  instead of array position.
- The home page shows the current local-storage status. **Protect local data**
  calls `navigator.storage.persist()` only after you click it; the browser
  decides whether persistent storage is granted.
- This remains device- and browser-profile-local. Version 3 does not add an
  account or cloud sync.

Validate Version 3 with:

```bash
npm run validate:storage
npm run validate:data
npm run validate:difficulty
npm run validate:planner
npm run validate:search
npm run build
```

## Version 2 — Planly

Version 2 adds a local Planly workflow for all 487 tracker questions. It keeps
the sheet as the source of truth for completion and stores planner data under
the separate `A2Z_Planly_v2` browser-storage key.

- Review and select tracker topics before generating a plan.
- Set a different whole-hour availability for every weekday from 0–16 hours;
  zero creates a day off. Weekdays start at three hours and weekends at five.
- Choose Today, Tomorrow, or a custom start date and browse the resulting
  seven-day sprints.
- Use 25/40/50-minute estimates for easy/medium/hard effort tiers.
- Track timers, completion, streaks, backlog, pause/resume, catch-up, and
  schedule rebuilding after availability changes.
- Completing a planner task immediately updates the original tracker.
- Search all 487 questions from the home page or filter within the open topic.
  Global results navigate directly to and highlight the selected question.
- Completed questions move below pending questions. New completions are appended
  after earlier completions, matching the 450 DSA behavior across reloads.

## Tracker Plus additions

This local edition keeps the original tracker experience and adds the 31
questions that are present on the live Striver sheet but absent from the
tracker comparison. Question titles now open the preferred practice source in
this order: **LeetCode, GeeksforGeeks, then Code360**. The original
takeUforward destination is shown separately as a small **Article** link, when
an article exists.

The dataset contains 487 questions. Existing progress stored under
`A2Z_Archive` remains compatible because new questions are appended in new
categories.

The current link audit resolves 292 question titles to LeetCode, 144 to GFG,
and 27 to Code360. The remaining 24 rows are genuine theory/tutorial entries,
not judge problems. Article coverage includes every one of the 159 unique URLs
linked by the current live sheet plus verified matches from TUF's full DSA blog
catalog: 313 question rows now expose 271 distinct working Article URLs.
Unresolved or contract-mismatched links are intentionally hidden.

Every question also has a compact **GFG** article pill. Of the 487 rows, 315
use a question-specific GFG explanatory page selected from the official GFG
post catalog; the remaining 172 use the closest topic-level GFG guide instead
of an unverified fuzzy match. Consequently, 313 rows display both **TUF** and
**GFG**, while 174 display **GFG** only. The 487 GFG pills resolve to 291
distinct article URLs; GFG judge/problem and search-result URLs are excluded.

For context, TUF's full blog catalog currently reports 439 articles and its
official sitemap lists 435 DSA article URLs. The remaining catalog pages are
not attached here when they do not match one of this tracker's 487 questions.

Run locally with:

```bash
npm install
npm run dev
```

Validate the question totals and link rules with:

```bash
npm run validate:data
```

[![React Badge](http://img.shields.io/badge/Powered%20By-React-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Website Badge](https://img.shields.io/badge/Visit-Now-green?style=for-the-badge&logo=vercel)](https://a2zdsa.pages.dev/)

## Overview 👀

![cover](https://user-images.githubusercontent.com/63164037/194750460-b42c8096-dbc9-43c0-aaa0-5e581b357c4a.png)

- **Topic wise question search 🔍**
- **Random question picker😉**
- **question wise notes 😇**
- **Topic wise progress 🧐**
- **Complete local storage 📂**
- **Mobile first design ✌🏻**
- **Clean UI ⚡**
- **[Stress Relief Game] 🎮**

## What is A2Z-DSA Tracker 🤔

#### A2Z DSA Tracker is a comprehensive list of 450+ topic wise questions to build your confidence in data structure and algorithms and prepare yourself for placements.

#### A2Z DSA Tracker doesn't guarantee a job but guarantees your confidence in solving any coding problem if done in the right way 👍🏻.

#### More details on how _[A2Z DSA Tracker]_ can help you -> _[Here]_.

## Dependencies 🗃

- _[React]_ - **Frontend Framework**
- _[Chakra UI]_ - **Component Library**

## Deployed Website 🌎

https://a2zdsa.pages.dev/

## Sample Demo 📽

https://user-images.githubusercontent.com/63164037/193985341-85f57456-6057-4444-b2c9-51f1ccd9dc83.mp4

## Run Locally 💻

```
> Clone the repo
    >> For Windows: Git Bash
    >> For Linux: Terminal
    >> git clone https://github.com/aditya-190/a2zdsa.git

> Change the folder location to your source Code Folder
    >> cd a2zdsa/src

> Install the dependencies
    >> yarn install

> Start the server
    >> yarn dev

> a2zdsa runs on port 3000 of your Local Machine
```

## How to Contribute 💥

[![OPEN-PR](https://img.shields.io/badge/Open%20For-PR-orange?style=for-the-badge&logo=github)](https://github.com/aditya-190/a2zdsa/pulls)

- Take a look at the Existing [Issues](https://github.com/aditya-190/a2zdsa/issues) or create your
  own Issues!
- Wait for the Issue to be assigned to you after which you can start working on it.
- Fork the Repo and create a Branch for any Issue that you are working upon.
- Create a Pull Request which will be promptly reviewed and suggestions would be added to improve it.
- Add Screenshots to help me know what this Code is all about.

## Credits 🙏🏻

#### Curated list of question in _[A2Z]_ is based on _[A2Z DSA Cracker Sheet]_ by _[Striver]_

#### Design ideas and motivation to build a website like same is based on _[450]_ by _[V Asish Raju]_

## Developed By 👦

<h2 align="center">Aditya Bhardwaj</h2>
<p align="center">
  <a href="https://github.com/aditya-190"><img src="https://avatars.githubusercontent.com/u/63164037?v=4" width=150px height=150px  alt="Aditya Bhardwaj"/></a>

<p align="center">
  <a target="_blank" href="https://www.linkedin.com/in/adi-bhardwaj/"><img src="https://img.shields.io/badge/linkedin-%230077B5.svg?&style=for-the-badge&logo=linkedin&logoColor=white"  alt="Aditya Bhardwaj"/></a>&nbsp;&nbsp;&nbsp;
  <a href="mailto:aadi.bbhardwaj@gmail.com?subject=Hello%20Aditya,%20From%20Github"><img src="https://img.shields.io/badge/gmail-%23D14836.svg?&style=for-the-badge&logo=gmail&logoColor=white"  alt="Aditya Bhardwaj"/></a>
</p>

[here]: https://www.youtube.com/watch?v=rHn9af16O_E
[A2Z DSA Tracker]: https://a2zdsa.pages.dev/
[A2Z]: https://a2zdsa.pages.dev/
[striver]: https://in.linkedin.com/in/rajarvp
[a2z dsa cracker sheet]: https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/
[Stress Relief Game]: https://a2zdsa.pages.dev/play
[react]: https://reactjs.org/
[chakra ui]: https://chakra-ui.com/
[450]: https://450dsa.com/
[V Asish Raju]: https://www.linkedin.com/in/asishraju/
