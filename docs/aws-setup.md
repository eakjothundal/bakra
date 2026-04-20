# AWS / Netlify setup — bakra-party leaderboard

One-time manual steps to wire up the DynamoDB table + IAM credentials for the leaderboard functions.

## 1. Create the DynamoDB table

AWS Console → DynamoDB → Create table.

- **Table name:** `bakra-party-scores`
- **Partition key:** `playerId` (String)
- **Sort key:** (none)
- **Capacity mode:** On-demand

No GSIs, no TTL, no encryption customization needed.

## 2. Create the IAM user + policy

AWS Console → IAM → Users → Create user `bakra-party-netlify`.

- Skip "provide user access to console".
- Attach policy (inline) with exactly this JSON (replace `<YOUR_REGION>` and `<YOUR_ACCOUNT_ID>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:<YOUR_REGION>:<YOUR_ACCOUNT_ID>:table/bakra-party-scores"
    }
  ]
}
```

- After the user is created: Security credentials → Create access key → "Application running outside AWS". Save the access key ID + secret in a password manager — you only see the secret once.

## 3. Netlify environment variables

Netlify dashboard → Site configuration → Environment variables → Add:

| Key | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | from step 2 |
| `AWS_SECRET_ACCESS_KEY` | from step 2 |
| `AWS_REGION` | e.g. `us-east-1` — must match the table's region |
| `DDB_TABLE_NAME` | `bakra-party-scores` |

Redeploy the site after adding the vars.

## 4. Smoke test

After redeploy:

```bash
curl https://<your-site>.netlify.app/.netlify/functions/get-leaderboard
# -> {"entries":[]}
```

A first `submit-score` call will populate the table; re-hit `get-leaderboard` to verify the new row appears.

## Teardown

After the event: delete the DynamoDB table (removes all scores + storage) and deactivate/delete the IAM user's access key.
