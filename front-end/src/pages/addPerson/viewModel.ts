import { UserService } from "../../service/api/user";
import { useCallback, useState } from "react";
const useViewModel = () => {
  const userService = new UserService();
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);

  const handleUploadXLSX = useCallback((file: File) => {
    setXlsxFile(file);
  }, []);

  const handleOnSubmitXLSX = async () => {
    const entity = new FormData();
    entity.append("file", xlsxFile as Blob);
    const response = await userService.reqPostAddUserByXLSX(entity);
    return response;
  };
  return { xlsxFile, handleUploadXLSX, handleOnSubmitXLSX };
};
export default useViewModel;
