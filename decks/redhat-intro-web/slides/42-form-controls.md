## HTML Forms {slot=heading}

### Form controls

<form id="input-types">

{% inputType %}text{% endinputType %}
{% inputType %}password{% endinputType %}
{% inputType %}checkbox{% endinputType %}
{% inputType %}radio{% endinputType %}
{% inputType %}range{% endinputType %}
{% inputType %}color{% endinputType %}
{% inputType %}datetime-local{% endinputType %}
{% inputType %}file{% endinputType %}

{% rhalert state="danger", title="Careful:" %}
Controls must be **labelled**. Placedholders are not enough.
{% endrhalert %}
</form>

