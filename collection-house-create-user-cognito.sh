aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_MZDlf6lho \
  --username jnovales@novales.com.gt \
  --user-attributes Name=email,Value=jnovales@novales.com.gt Name=name,Value=J Novales

aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_MZDlf6lho \
  --username jnovales@novales.com.gt \
  --password CnkztizE8jgs7w-zQa7e+ \
  --permanent