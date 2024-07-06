## 構成

- Next.js
- Prisma
- PostgreSQL
- JWToken

## 目的

- JWToken を使用して、ログインして session を Cookie 保存
- セッションの有効期限が切れていたら renewSession し、再度 Cookie へ新しい値を保存
  - このとき、renewSession は APIRoute を使う必要あり
- renewSession の有効期限が切れていたらログイン画面へ戻す
