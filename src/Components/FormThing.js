const TextField = ({value, onChange}) => (
  <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
);

const NumberField = ({value, onChange}) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

const Checkbox = ({value = false, onChange}) => (
  <input
    type="checkbox"
    checked={value}
    onChange={(e) => onChange(e.target.checked)}
  />
);

const inputs = {
  text: TextField,
  number: NumberField,
  checkbox: Checkbox,
};

export const FormThing = ({fields, data, onChange}) =>
  fields.map(({prop, label, type, info}) => {
    const Field = inputs[type];
    return (
      <div key={prop} title={info}>
        <label>{label}</label>
        <Field value={data?.[prop]} onChange={(val) => onChange(val, prop)} />
      </div>
    );
  });
