import { TableProps } from "@/types";

export default function Table({ headers, data }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            {headers.map((header) => (
              <th key={header} className="px-4 py-2 border dark:border-gray-600 capitalize">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-t dark:border-gray-600">
              {headers.map((header) => (
                <td key={header} className="px-4 py-2 border dark:border-gray-600">
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
