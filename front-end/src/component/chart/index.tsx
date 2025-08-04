import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export const data = {
  labels: ["เอกสารผ่านแล้ว", "รอการพิจารณา", "กำลังเลือกบริษัท"],
  datasets: [
    {
      data: [60, 20, 20],
      backgroundColor: ["#344BFD", "#F4A79D", "#F68D2B"],
      datalabels: {
        anchor: "end" as const,
      },
    },
  ],
};

export const options = {
  responsive: true,
  aspectRatio: 4 / 3,
  cutoutPercentage: 32,
  layout: {
    padding: 32,
  },
  elements: {
    line: {
      fill: false,
    },
    point: {
      hoverRadius: 7,
      radius: 5,
    },
  },
  plugins: {
    legend: {
      display: false,
    },

    datalabels: {
      backgroundColor: "#ECEAF8",
      borderRadius: 50,
      color: "black",
      display: (context: any) => {
        var dataset = context.dataset;
        var count = dataset.data.length;
        var value = dataset.data[context.dataIndex];
        return value > count * 1.5;
      },
      font: {
        weight: "bold" as const,
        size: 14,
      },
      padding: 10,
      formatter: (value: number) => `${Math.round(value)}%`,
    },
  },
};

export function DouhnutChart() {
  return <Doughnut data={data} options={options} />;
}
