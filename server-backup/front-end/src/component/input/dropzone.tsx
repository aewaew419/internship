import { useDropzone } from "react-dropzone";
import { useCallback, useState, useEffect } from "react";
import { CloudUploadOutlined } from "@mui/icons-material";

type dropZoneType = {
  handleUpload: (file: File) => void;
  file: File | string | null;
  preview?: boolean;
};

export const Dropzone = (props: dropZoneType) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        props.handleUpload(file);
        setFileName(file.name);
        setPreviewUrl(URL.createObjectURL(file));
      }
    },
    [props.handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [], // .xlsx
      "application/vnd.ms-excel": [], // .xls
      "image/*": [],
    },
    multiple: false,
  });

  useEffect(() => {
    if (props.file instanceof File) {
      setFileName(props.file.name);
    } else if (typeof props.file === "string") {
      setFileName(props.file);
    } else {
      setFileName(null);
    }
  }, [props.file]);

  return (
    <div
      {...getRootProps()}
      className={`${
        fileName ? "py-5" : "py-20  px-4"
      } text-center border border-primary-600 border-dashed rounded-lg cursor-pointer my-4`}
    >
      <input {...getInputProps()} />
      {fileName ? (
        <p className="text-primary-600 font-medium">
          {props.preview ? (
            previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-auto h-90 object-cover mx-auto rounded-lg shadow my-6"
              />
            ) : (
              <img
                src={import.meta.env.VITE_APP_API_V1 + fileName}
                alt="Preview"
                className="w-auto h-90 object-cover mx-auto rounded-lg shadow my-6"
              />
            )
          ) : (
            fileName
          )}
        </p>
      ) : isDragActive ? (
        <p className="text-primary-600">
          Drop the {props.preview ? "Picture" : "Excel file"} here...
        </p>
      ) : (
        <div className="text-primary-600">
          <CloudUploadOutlined fontSize="large" className="mb-5" />
          <p className="text-xl font-semibold">
            Choose a file or drag & drop it here
          </p>
          <p className="text-primary-300">
            {props.preview ? "Picture" : "Excel file"} up to 10 MB
          </p>
          <button
            type="button"
            className="mt-10 border border-primary-600 rounded-lg px-5 py-2 font-semibold text-lg"
          >
            Browse File
          </button>
        </div>
      )}
    </div>
  );
};
