# Конвертация шаблонов Endorphin 1 в 2

Автоматически конвертирует следующие вещи:

* `<t-*>` → `<e:*>`
* `@prop-name` → `propName`
* `$var-name` → `@var-name`
* `state('state-name')` → `#stateName`
* `<t-variable name="var-name" value="var-value">` → `<e:variable var-name={var-value}>`
* Явные выражения в `<e:if test={}>`, `<e:when test={}>`, `<e:for-each select={}>`
* `on-event="handler"` → `on:event={handler}`
* В компонентах `prop-name=""` → `propName=""`
