import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "./lib/utils";

type Item = {
  index: string;
  id: string;
  name: string;
  morningStations: { [key: string]: boolean };
  eveningStations: { [key: string]: boolean };
};

const normalizeVietnamese = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
};

const stationNames = {
  station1: "Điện Biên Phủ",
  station2: "Ngã tư Bình Phước",
  station3: "AEON Bình Dương",
  station4: "Chợ Hàng Bông",
  station5: "Ngã tư Thủ Đức",
  station6: "Vincom Dĩ An",
};

function App() {
  const [data, setData] = useState<Item[]>([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [stationFilters, setStationFilters] = useState<string[]>(["all"]);
  const [nameFilter, setNameFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [doubleClickedRows, setDoubleClickedRows] = useState<Set<string>>(
    new Set()
  );
  const [sortBy, setSortBy] = useState<"selected" | "unselected" | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const today = new Date();
    const sheetName = today
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");

    fetch(
      `https://docs.google.com/spreadsheets/d/1nVdESerxIJt2wGWOOVJtHrU_0-ytdI57ZJhRLtzMMAk/gviz/tq?tqx=out:csv&sheet=${sheetName}`
    )
      .then((response) => response.text())
      .then((csv) => {
        const rows = csv.split("\n");
        const dataRows = rows.slice(1, -1);
        const parsedData = dataRows.map((row) => {
          const values = row.replace(/["]/g, "").split(",");
          console.log(values);

          return {
            index: values[0],
            id: values[1],
            name: values[2].toUpperCase(),
            morningStations: {
              station1: values[3] === "1",
              station2: values[4] === "1",
              station3: values[5] === "1",
              station4: values[6] === "1",
              station5: values[7] === "1",
              station6: values[8] === "1",
            },
            eveningStations: {
              station1: values[9] === "1",
              station2: values[10] === "1",
              station3: values[11] === "1",
              station4: values[12] === "1",
              station5: values[13] === "1",
              station6: values[14] === "1",
            },
          };
        });

        setData(parsedData);
      });
  }, []);

  const filteredData = data.filter((item) => {
    const matchesTime =
      timeFilter === "all" ||
      (timeFilter === "morning" &&
        Object.values(item.morningStations).some((v) => v)) ||
      (timeFilter === "evening" &&
        Object.values(item.eveningStations).some((v) => v));

    const matchesStation =
      stationFilters.includes("all") ||
      stationFilters.some(
        (station) =>
          item.morningStations[station] || item.eveningStations[station]
      );

    const matchesName =
      nameFilter === "" ||
      normalizeVietnamese(item.name).includes(normalizeVietnamese(nameFilter));

    return matchesTime && matchesStation && matchesName;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortBy) return 0;

    const isASelected =
      selectedRows.has(a.index) || doubleClickedRows.has(a.index);
    const isBSelected =
      selectedRows.has(b.index) || doubleClickedRows.has(b.index);

    if (sortBy === "selected") {
      return isBSelected ? 1 : isASelected ? -1 : 0;
    } else {
      return isASelected ? 1 : isBSelected ? -1 : 0;
    }
  });

  const handleStationChange = (value: string) => {
    if (value === "all") {
      setStationFilters(["all"]);
    } else {
      const newFilters = stationFilters.filter((f) => f !== "all");
      if (newFilters.includes(value)) {
        if (newFilters.length === 1) {
          setStationFilters(["all"]);
        } else {
          setStationFilters(newFilters.filter((f) => f !== value));
        }
      } else {
        setStationFilters([...newFilters, value]);
      }
    }
  };

  const toggleRowSelection = (index: string) => {
    const newSelected = new Set(selectedRows);
    const newDoubleClicked = new Set(doubleClickedRows);

    if (newDoubleClicked.has(index)) {
      newDoubleClicked.delete(index);
      newSelected.delete(index);
    } else if (newSelected.has(index)) {
      newSelected.delete(index);
      newDoubleClicked.add(index);
    } else {
      newSelected.add(index);
    }

    setSelectedRows(newSelected);
    setDoubleClickedRows(newDoubleClicked);
  };

  const showBothColumns =
    timeFilter === "all" && stationFilters.includes("all");

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between text-sm text-gray-500 whitespace-nowrap">
        <div>
          {currentTime.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        <div>
          {currentTime.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>
      <div className="relative">
        <Input
          placeholder="Tìm kiếm theo tên..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="text-sm pr-8"
        />
        {nameFilter && (
          <button
            onClick={() => setNameFilter("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Select value={timeFilter} onValueChange={setTimeFilter}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Chọn thời gian" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả ca</SelectItem>
          <SelectItem value="morning">Lên ca</SelectItem>
          <SelectItem value="evening">Xuống ca</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={() => handleStationChange("all")}
          className={`text-sm px-3 py-2 rounded ${
            stationFilters.includes("all")
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
        >
          Tất cả trạm
        </button>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(stationNames).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleStationChange(key)}
              className={`px-3 py-2 rounded ${
                stationFilters.includes(key)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="text-sm text-gray-500 text-center flex justify-evenly">
        <div>Tổng cộng {filteredData.length} người </div>
        {(selectedRows.size > 0 || doubleClickedRows.size > 0) && (
          <div
            onClick={() => {
              setSelectedRows(new Set());
              setDoubleClickedRows(new Set());
            }}
            className="flex items-center gap-2"
          >
            Đã chọn {selectedRows.size + doubleClickedRows.size} người
          </div>
        )}
      </div>
      <div className="rounded-md overflow-auto border max-h-[calc(100dvh-22rem)] text-center">
        <Table>
          <TableHeader className="bg-gray-100 sticky top-0">
            <TableRow
              onClick={() =>
                setSortBy(sortBy === "unselected" ? "selected" : "unselected")
              }
            >
              <TableHead className="text-center border-r">#</TableHead>
              <TableHead
                className={cn("text-center", showBothColumns && "border-r!")}
              >
                Tên
              </TableHead>
              {showBothColumns && (
                <>
                  <TableHead className="text-center border-r!">
                    Trạm lên ca
                  </TableHead>
                  <TableHead className="text-center">Trạm xuống ca</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => (
                <TableRow
                  key={index}
                  onClick={() => toggleRowSelection(item.index)}
                  className={cn(
                    "cursor-pointer",
                    selectedRows.has(item.index) &&
                      "bg-emerald-500 text-white hover:bg-emerald-600",
                    doubleClickedRows.has(item.index) &&
                      "bg-red-500 text-white hover:bg-red-600"
                  )}
                >
                  <TableCell className="text-center border-r">
                    {index + 1}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-center",
                      showBothColumns && "border-r!"
                    )}
                  >
                    {item.name}
                  </TableCell>
                  {showBothColumns && (
                    <>
                      <TableCell
                        className={cn(
                          "text-center",
                          showBothColumns && "border-r!"
                        )}
                      >
                        {Object.entries(item.morningStations).map(
                          ([station, value]) =>
                            value && (
                              <span key={station} className="text-center">
                                {
                                  stationNames[
                                    station as keyof typeof stationNames
                                  ]
                                }
                              </span>
                            )
                        )}
                      </TableCell>
                      <TableCell>
                        {Object.entries(item.eveningStations).map(
                          ([station, value]) =>
                            value && (
                              <span key={station} className="text-center">
                                {
                                  stationNames[
                                    station as keyof typeof stationNames
                                  ]
                                }
                              </span>
                            )
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={showBothColumns ? 3 : 2}
                  className="text-center text-muted-foreground"
                >
                  Không tìm thấy kết quả
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default App;
