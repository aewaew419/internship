type tableProps = {
  header: string[];
  data: React.ReactNode;
};
export const Table = (props: tableProps) => {
  return (
    <table className="w-full rounded-2xl">
      <thead className="bg-primary-600 text-white rounded-2xl">
        {props.header.map((data, index) => (
          <th
            className={`${
              index === 0
                ? "rounded-tl-2xl"
                : index === props.header.length - 1
                ? "rounded-tr-2xl"
                : ""
            } py-5`}
          >
            <td>{data}</td>
          </th>
        ))}
      </thead>
      <tbody>{props.data}</tbody>
    </table>
  );
};
