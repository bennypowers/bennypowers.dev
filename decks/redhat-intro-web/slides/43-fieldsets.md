## HTML Forms {slot=heading}

### Fieldsets

Form fields can be grouped into **fieldsets**. Fieldsets can have a `<legend>` 
to describe their contents, and if they are *disabled*, it disables all of its 
children.

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
