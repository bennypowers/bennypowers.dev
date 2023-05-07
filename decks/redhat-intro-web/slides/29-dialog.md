---
class: smaller-syntax
reveal: pre
---
## Semantic HTML {slot="heading"}

### Dialogs

<div class="revealer">

The `<dialog>` element is a web-native way to  present information to the user 
in a popup window or modal dialog.

<rh-button size="large" id="showModal" onclick="dialog.showModal()">Show 
Modal</rh-button>

<dialog id="dialog" onclose="output.value=`${dialog.returnValue} selected`;">
  <form method="dialog">
    <label>Choose a Platform:
      <select onchange="confirm.value=this.value;">
        <option disabled selected>Pick One</option>
        <option value="iOS">iOS (proprietary)</option>
        <option value="Google">Google (proprietary)</option>
        <option value="Windows">Windows (proprietary)</option>
        <option value="Web">Web (open)</option>
      </select>
    </label>
    <button id="confirm">Confirm</button>
  </form>
</dialog>

<output id="output"></output> 

```html 
<button id="showModal" onclick="dialog.showModal()">Show Modal</button>
<dialog id="dialog" onclose="output.value=`${dialog.returnValue} selected`">
  <form method="dialog">
    <label>Choose a Platform:
      <select onchange="confirm.value=this.value">
        <option disabled selected>Pick One</option>
        <option value="iOS">iOS (proprietary)</option>
        <option value="Google">Google (proprietary)</option>
        <option value="Windows">Windows (proprietary)</option>
        <option value="Web">Web (open)</option>
      </select>
    </label>
    <button id="confirm">Confirm</button>
  </form>
</dialog>
<output id="output"></output>
```

</div>
