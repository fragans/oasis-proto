# i need to plan a refactor and replacing campaign feature:
in campaign, there will be 2 submenu on-site-message and in-app-message
this plan only about on-site-message

## A. Web Templates: Select a Web Template to design and add interactive features to your website.
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
**campaigns/rules** : this page must be the same as **/audiences/segement
segments card: choose multiple segments such as:
 - Attributes: Target the users based on if they have an Attribute you select.
 - Events: Target the users based on if they performed an Event you select.
 - Device Attributes: Target the users based on their mobile device attributes such as device model, operating system, and app version.
 - Location: Target the users based on their IP Address location.

## C. Rules
## D. Goals
## E. Launch
