---
reveal: pre:nth-of-type(2)
---
## HTML Forms {slot=heading}

Forms can have an **action** and a **method**, which determines how and where 
they send their contents.

<div style="position:relative">

```html
<form method="POST" action="/users/new.php">
  <label>Username <input name="username" type="text"></label>
  <label>Password <input name="password" type="password"></label>
  <button>Register</button>
</form>
```

<form method="POST" action="/users/new.php"
      onsubmit="return !!deck.forward();">
  <label>Username <input name="username" type="text"></label>
  <label>Password <input name="password" type="password"></label>
  <button>Register</button>
</form>

```http
POST /users/new.php HTTP/1.1
Host: localhost:8080
Content-Type: application/x-www-form-urlencoded
Content-Length: 31

username=RedHat&password=Beyond
```

</div>
