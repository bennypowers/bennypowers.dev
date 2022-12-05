## HTML Forms {slot=heading}

Form fields can be grouped into **fieldsets** which have a `<legend>` and can be 
*disabled*.

<form id="fieldsets">

<fieldset id="fieldset">
  <legend>Disabling fieldsets disables their children</legend>
  <label for="fieldset-text-input">Text</label>
  <input id="fieldset-text-input">
  <label for="fieldset-checkbox-input">Checkbox</label>
  <input id="fieldset-checkbox-input" type="checkbox">
  <label for="fieldset-tel-input">Telephone</label>
  <input id="fieldset-tel-input" type="tel">
</fieldset>

<label>Toggle fieldset `disabled` attribute
       <input type="checkbox" onchange="fieldset.disabled=!fieldset.disabled">
</label>

</form>
