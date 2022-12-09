import child_process from 'child_process';
import { resolve } from 'path';
import { ApexOptions } from 'apexcharts';
import { writeFile } from 'fs/promises';

function openHtmlFile(path) {
  let command = '';
  switch (process.platform) {
    case 'darwin':
      command = 'open chrome';
      break;
    case 'win32':
      command = 'start chrome';
      break;
    default:
      command = 'xdg-open';
      break;
  }
  return child_process.execSync(`${command} "${resolve(path)}"`);
}

export async function outputChart(filename: string, options: ApexOptions = {}) {
  const output = `
<!DOCTYPE html>
<html>
<head>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
  <div id="chart" style="width: 98vw; height: 98vh; box-sizing: border-box; border: #0a58ca solid 1px"></div>
  <script>
    var options = {
          series: [{
            name: "Desktops",
            data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
        }],
          chart: {
          height: 500,
          type: 'line',
          zoom: {
            enabled: false
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'straight'
        },
        title: {
          text: 'Product Trends by Month',
          align: 'left'
        },
        grid: {
          row: {
            colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0.5
          },
        },
        ...(${JSON.stringify(options)})
        };

        var chart = new ApexCharts(document.querySelector("#chart"), options);
        chart.render();

        console.log(options);
  </script>
</body>
</html>
  `;

  await writeFile(`./${filename}.html`, output, 'utf8');

  openHtmlFile(`./${filename}.html`);
}

export async function outputTable(
  filename: string,
  data: Record<string, unknown>[],
  css = `
    table, th, td {
      border: #0d6efd solid 1px;
      padding: 3px;
      font-size: 2.3rem;
    }
  `
) {
  const tableHeaders = `
    <tr>
      ${Object.keys(data[0])
        .map((key) => `<th>${key}</th>`)
        .join('')}
    </tr>`;

  const tableRows = data
    .map(
      (row) => `
      <tr>
        ${Object.values(row)
          .map((col) => `<td>${col}</td>`)
          .join('')}
      </tr>`
  ).join('');

  const tableOutput = `
    <table>
      ${tableHeaders}${tableRows}
    </table>`;

  const output = `
<!DOCTYPE html>
<html>
<head>
<style>
${css}
</style>
</head>
<body>
${tableOutput}
</body>
</html>
  `;

  await writeFile(`./${filename}.html`, output, 'utf8');

  openHtmlFile(`./${filename}.html`);
}
