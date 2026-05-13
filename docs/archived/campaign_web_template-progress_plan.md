/gsd-new-project "Refactor Campaign System: On-Site Messages" --vibe "Nuxt 4.4 + Nuxt UI 4.6"
# i need to plan a refactor and update campaign feature:
in campaign, there will be 2 submenu on-site-message and in-app-message
this plan only about on-site-message

## Web Templates(on-site-message): Select a Web Template to design and add interactive features to your website.
this is the flow for create new `web template campaign`

### 1. Design: goals: Design one or more alternative versions of your campaign to show.
**campaigns/index**
create button -> show modal input text for `campaign name`
**/campaigns/create/index**
- there is a a/b testing card variant, which contains: input text(s) for variant name & traffic allocation(%)
- max 2 variant card exists
**/campaigns/create/builder**
- user will facing a canvas preview in right-side, inside there is a floating button to switch the preview responsive design (desktop, mobile, tablet)
- user will facing a text editor in left-side, consists of 3 panel: html, css and js
- in header: there will be save and cancel buttons. cancel will redirect user to /campaigns/create/index


## B. Segments: goals: Select one or more user groups to show your campaign.
**campaigns/rules** : this step we can create new segment like in the **/audiences/segment/create or select existing segment for this campaign

## C. Rules
- Page Rules: Trigger your campaign based on a page type or a parameter in a URL. ex: page url, most visit category
- Page Behavior: Trigger your campaign based on users' scroll and exit intent actions on your website. ex: scroll down %
- User Rules: Trigger your campaign based on users' login status or ad blocking preference.ex: time spent on site. ex: traffic source(location, country, city, device-type, browser)

## D. Goals
Set goals to track the performance of your campaign.
- purchase
- click

## E. Launch
- Activation Status: Active, Test, Passive
- Activation Time: You can set the duration that your campaign will be active based on the date & time you input. 
