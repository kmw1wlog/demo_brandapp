# Collected Data Columns

## leads

| column | meaning |
| --- | --- |
| `id` | lead row id |
| `name` | email or name entered by user |
| `phone` | phone entered by user |
| `category` | selected category or CTA category |
| `region` | page path or region context |
| `budget` | normalized numeric budget if available |
| `notes` | freeform note |
| `payload` | raw CTA payload including `purpose`, `benefit`, `pagePath` |
| `created_at` | saved timestamp |

## branch_feedback_entries

| column | meaning |
| --- | --- |
| `id` | feedback row id |
| `stage` | startup stage |
| `blocker` | current blocker |
| `feature` | desired benefit / feature |
| `consultation` | consultation opt-in |
| `contact` | email or phone |
| `payload` | raw survey payload including note and pagePath |
| `created_at` | saved timestamp |

## branch_user_inputs - analytics_session_export

| payload field | meaning |
| --- | --- |
| `kind` | `analytics_session_export` |
| `row.session_id` | browser analytics session id |
| `row.entry_path` | first page in session |
| `row.last_page_path` | last page seen before export |
| `row.page_views` | page view count |
| `row.analytics_event_count` | Mixpanel/local analytics event count |
| `row.analytics_event_names` | unique analytics event names |
| `row.branch_event_count` | branch event count |
| `row.branch_event_names` | unique branch event names |
| `row.beta_signup_count` | beta signup count in session |
| `row.beta_signup_purposes` | beta signup purposes in session |
| `row.selected_brand_id` | current selected brand id |
| `row.mixpanel_token` | environment token used |
| `raw_json` | full exported local session payload |

## branch_user_inputs - share_event fallback

| payload field | meaning |
| --- | --- |
| `kind` | `share_event` |
| `session_id` | browser analytics session id |
| `event_name` | `share_cta_clicked` or `share_completed` |
| `share_type` | `link` or `summary` |
| `page_path` | page where share happened |
| `category` | category visible at the moment |
| `brand_name` | brand visible at the moment |
| `share_title` | shared card title |
| `mixpanel_token` | environment token used |
| `analytics_env` | `staging` or `prod` |
| `distinct_id` | browser distinct id |
