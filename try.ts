interface ITableMetaData {
  templateId: string;
  columns: string[];
  columnsOrder: string[];
  filters: string; // TODO : upgrade mongo version
}

interface IIframeMetaData {
  iframeId: string;
}

interface IChartMetaData {
  chartId: string;
}

type IDashboardMetaData = ITableMetaData | IIframeMetaData | IChartMetaData;

enum DashboardItemType {
  Iframe = "iframe",
  Chart = "chart",
  Table = "table",
}

interface IDashboardItem {
  type: DashboardItemType;
  dashboardMetaData: IDashboardMetaData;
}

interface dashboard {
  _id: string;
  name: string;
  permission: "private|protected";
  createdBy: "";
  items: IDashboardItem[];
}

interface dashboardItems {
  _id: string;
  name: string;
  type: DashboardItemType;
  metaData: IDashboardMetaData;
  permission: "private|protected";
  createdBy: "";
}
