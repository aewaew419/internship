import "dayjs/locale/th";
import Dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

Dayjs.extend(buddhistEra);

export default class AdapterDayjsBE extends AdapterDayjs {
  constructor({
    locale,
    formats,
  }: {
    locale?: string;
    formats?: any;
    instance?: any;
  }) {
    super({ locale, formats });
  }
  formatByString = (date: any, format: any) => {
    if (format === "YYYY") {
      format = "BBBB";
    }
    return Dayjs(date).format(format);
  };
}
