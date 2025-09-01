import { useField, useFormikContext } from "formik";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  FormHelperText,
  Checkbox,
  FormGroup,
} from "@mui/material";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import AdapterDayjsBE from "./adapter";
import type { DateView } from "@mui/x-date-pickers/models";

import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
type RadioOption = {
  label: string;
  value: any;
};
type RadioFieldProps = {
  name: string;
  label: string;
  options: RadioOption[];
  row?: boolean;
  disable?: boolean;
};
export const RadioField = ({
  name,
  label,
  options,
  disable = false,
  row = false,
}: RadioFieldProps) => {
  const [field, meta, helpers] = useField(name);

  return (
    <FormControl
      fullWidth
      component="fieldset"
      error={meta.touched && Boolean(meta.error)}
      disabled={disable}
    >
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup
        row={row}
        name={field.name}
        value={field.value || 0}
        onChange={(e) => {
          helpers.setValue(e.target.value);
        }}
      >
        {options.map((option, key) => (
          <div key={key} className="my-1">
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={
                <Radio
                  sx={{
                    color: "#F45626",
                    "&.Mui-checked": {
                      color: "#F45626",
                    },
                    height: "25px",
                    width: "25px",
                    marginLeft: "10px",
                    marginRight: "10px",
                  }}
                />
              }
              label={option.label}
            />
          </div>
        ))}
      </RadioGroup>
      {meta.touched && meta.error && (
        <FormHelperText>{meta.error}</FormHelperText>
      )}
    </FormControl>
  );
};

type FieldProps = {
  name: string;
  label_th?: string;
  label_en?: string;
  label?: string;
  placeholder?: string;
  type?: "text" | "number" | "password";
  require?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  row?: number;
};

const Field = ({
  name,
  label_th,
  label_en,
  placeholder,
  label,
  type = "text",
  require = false,
  disabled = false,
  multiline = false,
  row = 4,
}: FieldProps) => {
  const [field, meta] = useField(name);

  return (
    <div className="w-full">
      <div className="font-medium text-secondary-600">
        <h5 className="text-xl">{label_th}</h5>
        <p className="text-sm -mt-1.5">{label_en}</p>
      </div>
      <TextField
        margin="dense"
        type={type}
        fullWidth
        variant="outlined"
        size="small"
        placeholder={placeholder}
        label={label}
        error={meta.touched && Boolean(meta.error)}
        helperText={meta.touched && meta.error}
        required={require}
        disabled={disabled}
        multiline={multiline}
        rows={row}
        {...field}
      />
    </div>
  );
};

type AutoCompleteItem = {
  value: any;
  label: string;
};

type AutoCompleteProps = {
  name: string;
  items: AutoCompleteItem[];
  label_th?: string;
  label_en?: string;
  label?: string;
  require?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

const AutoCompleteField = ({
  items,
  name,
  placeholder,
  label_th,
  label_en,
  label,
  require,
  disabled,
}: AutoCompleteProps) => {
  const [field, meta, helpers] = useField(name);
  const { setValue, setTouched } = helpers;
  const selectedOption =
    items.find((item) => item.value === field.value) || null;
  return (
    <div className="w-full">
      <div className="font-medium text-secondary-600">
        <h5 className="text-xl">{label_th}</h5>
        <p className="text-sm -mt-1.5">{label_en}</p>
      </div>
      <Autocomplete
        fullWidth
        options={items}
        getOptionLabel={(option) => option.label}
        onBlur={() => setTouched(true)}
        onChange={(_: any, newValue: AutoCompleteItem | null) => {
          setValue(newValue?.value);
        }}
        value={selectedOption}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="dense"
            placeholder={placeholder}
            label={label}
            error={meta.touched && Boolean(meta.error)}
            helperText={meta.touched && meta.error}
            required={require}
            disabled={disabled}
            variant="outlined"
            size="small"
          />
        )}
      />
    </div>
  );
};

type DatePickerFieldProps = {
  label_th?: string;
  label_en?: string;
  label?: string;
  name: string;
  placeholder?: string;
  format?: string;
  views?: readonly DateView[];
};
export const DatePickerField = ({
  label_en,
  label_th,
  name,
  label,
  placeholder,
  format = "DD/MM/YYYY",
  views,
}: DatePickerFieldProps) => {
  const { setFieldValue } = useFormikContext<any>();
  const [field, meta] = useField(name);

  return (
    <div className="my-2 w-full">
      <div className="font-medium text-secondary-600">
        <h5 className="text-xl">{label_th}</h5>
        <p className="text-sm -mt-1.5">{label_en}</p>
      </div>
      <LocalizationProvider dateAdapter={AdapterDayjsBE} adapterLocale="th">
        <DatePicker
          format={format}
          views={views}
          label={label}
          value={field.value ? dayjs(field.value) : null}
          onChange={(date: Dayjs | null) => {
            setFieldValue(name, date ? date.toISOString() : "");
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              size: "small",
              placeholder: placeholder,
              error: meta.touched && Boolean(meta.error),
              helperText: meta.touched && meta.error,
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
};
type CheckboxFieldProps = {
  name: string;
  label: string;
  require?: boolean;
};
export const CheckboxField = ({
  name,
  label,
  require = false,
}: CheckboxFieldProps) => {
  const [field, meta, helpers] = useField({ name, type: "checkbox" });

  return (
    <FormControl error={meta.touched && Boolean(meta.error)} required={require}>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              {...field}
              checked={field.value}
              onChange={(e) => helpers.setValue(e.target.checked)}
            />
          }
          label={label}
        />
      </FormGroup>
      {meta.touched && meta.error && (
        <FormHelperText>{meta.error}</FormHelperText>
      )}
    </FormControl>
  );
};
export { Field, AutoCompleteField };
