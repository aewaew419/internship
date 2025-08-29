type tableProps = {
  header: React.ReactNode[];
  data: React.ReactNode;
};
export const Table = (props: tableProps) => {
  return (
    <table className="w-full rounded-2xl bg-white">
      <thead className="bg-primary-600 text-white rounded-2xl">
        <tr>
          {props.header.map((data, index) => (
            <th
              className={`${
                index === 0
                  ? "rounded-tl-2xl ps-4"
                  : index === props.header.length - 1
                  ? "rounded-tr-2xl"
                  : ""
              } py-5 text-start`}
              key={index}
            >
              {data}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{props.data}</tbody>
    </table>
  );
};
