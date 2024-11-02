import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PlusCircledIcon, RocketIcon } from "@radix-ui/react-icons";
import { SwitchMini } from "@/components/ui/switchmini";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const THREAD_COUNT = 5;
const DEFAULT_NODES = {
  "ISP CDN": {
    "咪咕快游[高速]":
      "https://freeserver.migufun.com/resource/beta/apk/20240712112601/MiguPlay-V3.85.1.1_miguzsj.apk",
    咪咕音乐:
      "https://wsdkdl.migu.cn:8443/b486900f41fc411187240dcb45fdbc8d/1723479628065/netsdk_b.js",
    咪咕视频:
      "https://img.cmvideo.cn/publish/noms/2023/12/06/1O4SHFIFR36BD.gif",
    和彩云:
      "https://img.mcloud.139.com/material_prod/material_media/20221128/1669626861087.png",
    联通电视: "NetworkPanelApi://listen.10155.com",
    联通公免: "https://m1.ad.10010.com/small_video/uploadImg/1669798519261.png",
    天翼云:
      "https://vod-origin-rjzy.gdoss.xstore.ctyun.cn/8ee30576c30d40518c4dae03f7eacf3c.mp4",
    天翼云桌面:
      "https://desk.ctyun.cn:8999/desktop-prod/software/windows_tob_client/15/64/202030001/CtyunClouddeskUniversal_2.3.0_202030001_x86_20240327104015_Setup.exe",
    "移动云盘1[定向]": "http://yun.mcloud.139.com/hongseyunpan/2.43G.zip",
  },
  "Global CDN": {
    Cachefly: "https://web1.cachefly.net/speedtest/downloading",
    Cloudflare: "https://speed.cloudflare.com/__down?bytes=104857600",
    jsDelivr: "https://cdn.jsdelivr.net/gh/ljxi/CDN-IP-test@main/dump",
    "Cloudflare Workers":
      "https://gh.con.sh/https://github.com/AaronFeng753/Waifu2x-Extension-GUI/releases/download/v2.21.12/Waifu2x-Extension-GUI-v2.21.12-Portable.7z",
    "Steam Akamai":
      "https://cdn.akamai.steamstatic.com/steam/apps/1063730/extras/NW_Sword_Sorcery_2.gif",
    "Steam Cloudflare":
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1063730/extras/NW_Sword_Sorcery_2.gif",
    "Microsoft Akamai":
      "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RW16Ptm",
  },
};

export default function App() {
  // State management
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState("");
  const [autoStart, setAutoStart] = useState(false);
  const [runInBackground, setRunInBackground] = useState(false);

  // Display stats
  const [displayStats, setDisplayStats] = useState({
    totalBytes: 0,
    currentSpeed: 0,
    averageSpeed: 0,
    maxSpeed: 0,
  });

  // Raw data tracking
  const statsRef = useRef({
    totalBytes: 0,
    lastUpdateBytes: 0,
    lastUpdateTime: 0,
    startBytes: 0,
    startTime: 0,
  });

  // Thread control
  const activeThreadsRef = useRef(new Set());
  const shouldRunRef = useRef(false);

  // Helper functions
  const onSelectNode = (node: string) => {
    // if still running, stop the test
    if (isRunning) {
      setIsRunning(false);
    }
    setSelectedNode(node);
  };

  // Format number to have at most 4 significant digits and 2 decimal places
  const formatNumber = useCallback((num: number) => {
    if (num === 0) return "0";
    if (num >= 1000) {
      return Math.round(num).toString();
    }
    if (num >= 100) {
      return num.toFixed(1);
    }
    return num.toFixed(2);
  }, []);

  // Format bytes to human readable format
  const formatBytes = useCallback(
    (bytes: number, type = "bytes") => {
      if (bytes === 0)
        return { value: "0", unit: type === "bits" ? "bps" : "B" };

      const k = type === "bits" ? 1000 : 1024;
      const sizes =
        type === "bits"
          ? ["bps", "Kbps", "Mbps", "Gbps", "Tbps"]
          : ["B", "KiB", "MiB", "GiB", "TiB"];

      let i = Math.floor(Math.log(bytes) / Math.log(k));
      i = Math.min(i, sizes.length - 1);

      const value = bytes / Math.pow(k, i);

      return {
        value: formatNumber(value),
        unit: sizes[i],
      };
    },
    [formatNumber]
  );

  // Start a single download thread
  const startThread = useCallback(async (threadId: number, url: string) => {
    if (!url || !shouldRunRef.current) return;

    const threadKey = `thread-${threadId}`;
    if (activeThreadsRef.current.has(threadKey)) return;
    activeThreadsRef.current.add(threadKey);

    try {
      while (shouldRunRef.current) {
        const response = await fetch(url, {
          cache: "no-store",
          mode: "cors",
          referrerPolicy: "no-referrer",
        });

        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();

        while (shouldRunRef.current) {
          const { value, done } = await reader.read();
          if (done) break;
          statsRef.current.totalBytes += value?.length || 0;
        }

        await reader.cancel();
      }
    } catch (error) {
      if (shouldRunRef.current) {
        setTimeout(() => startThread(threadId, url), 1000);
      }
    } finally {
      activeThreadsRef.current.delete(threadKey);
    }
  }, []);

  // Start/stop all threads
  useEffect(() => {
    if (isRunning && selectedNode) {
      shouldRunRef.current = true;
      statsRef.current.startTime = Date.now();
      statsRef.current.startBytes = statsRef.current.totalBytes;
      statsRef.current.lastUpdateTime = Date.now();
      statsRef.current.lastUpdateBytes = statsRef.current.totalBytes;

      for (let i = 0; i < THREAD_COUNT; i++) {
        startThread(i, selectedNode);
      }
    } else {
      if (statsRef.current.startTime) {
        // Calculate average speed only when stopping
        const totalTime = (Date.now() - statsRef.current.startTime) / 1000;
        const bytesTransferred =
          statsRef.current.totalBytes - statsRef.current.startBytes;
        const avgSpeed = totalTime > 0 ? bytesTransferred / totalTime : 0;

        setDisplayStats((prev) => ({
          ...prev,
          averageSpeed: avgSpeed,
        }));
      }
      shouldRunRef.current = false;
    }

    return () => {
      shouldRunRef.current = false;
    };
  }, [isRunning, selectedNode, startThread]);

  // Update display stats at a controlled rate
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const updateStats = () => {
      const now = Date.now();
      const timeDiff = (now - statsRef.current.lastUpdateTime) / 1000;
      const bytesDiff =
        statsRef.current.totalBytes - statsRef.current.lastUpdateBytes;

      // Only update current speed and total bytes while running
      const currentSpeed = timeDiff > 0 ? bytesDiff / timeDiff : 0;

      setDisplayStats((prev) => ({
        ...prev,
        totalBytes: statsRef.current.totalBytes,
        currentSpeed: currentSpeed,
        maxSpeed: Math.max(currentSpeed, prev.maxSpeed),
      }));

      statsRef.current.lastUpdateTime = now;
      statsRef.current.lastUpdateBytes = statsRef.current.totalBytes;
    };

    const intervalId = setInterval(updateStats, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning]);

  // Calculate estimates for the estimates tab
  const calculateEstimates = useCallback(
    (bytesPerSecond: number) => {
      if (bytesPerSecond === 0) return null;

      const intervals = {
        minute: 60,
        hour: 60 * 60,
        day: 60 * 60 * 24,
        week: 60 * 60 * 24 * 7,
        month: 60 * 60 * 24 * 30,
      };

      return Object.entries(intervals).map(([period, seconds]) => {
        const bytes = bytesPerSecond * seconds;
        const bytesFormatted = formatBytes(bytes);
        const bitsFormatted = formatBytes(bytes * 8, "bits");

        return {
          period,
          bytes: `${bytesFormatted.value} ${bytesFormatted.unit}`,
          bits: `${bitsFormatted.value} ${bitsFormatted.unit}`,
        };
      });
    },
    [formatBytes]
  );

  // Toggle test
  const toggleTest = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  return (
    <main className="flex flex-col h-screen w-screen items-center">
      <Card className="mt-20 w-[85%]">
        <CardHeader>
          <CardTitle className="text-xl underline decoration-wavy decoration-sky-500">
            SpeedTest
          </CardTitle>
        </CardHeader>
        <Separator className="flex w-[90%] mx-auto" />
        <CardContent>
          <div className="flex flex-col space-y-1.5 py-4">
            <Label htmlFor="node" className="font-medium text-sm">
              Node
            </Label>
            <div className="flex space-x-4">
              <Select value={selectedNode} onValueChange={onSelectNode}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select Node" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEFAULT_NODES).map(([category, nodes]) =>
                    Object.entries(nodes).map(([name, url]) => (
                      <SelectItem key={url} value={url}>
                        {name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <PlusCircledIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <span className="text-sm font-medium">Monitor</span>
          <div className="flex justify-around h-40 items-center space-x-4">
            <div className="flex flex-col items-start space-y-[-5px]">
              <span className="text-sm italic font-medium pb-1 w-[75px]">
                Traffic
              </span>
              <span className="text-3xl w-[70px] font-bold text-right">
                {formatBytes(displayStats.totalBytes).value}
              </span>
              <span className="text-xs italic font-medium w-full text-right">
                {formatBytes(displayStats.totalBytes).unit}
              </span>
            </div>
            <Separator orientation="vertical" />
            <div className="flex flex-col items-start space-y-[-5px]">
              <span className="text-sm italic font-medium pb-1 w-[75px]">
                {isRunning ? "Bandwidth" : "Avg. Speed"}
              </span>
              <span className="text-3xl w-[70px] font-bold text-right">
                {
                  formatBytes(
                    (isRunning
                      ? displayStats.currentSpeed
                      : displayStats.averageSpeed) * 8,
                    "bits"
                  ).value
                }
              </span>
              <span className="text-xs italic font-medium w-full text-right">
                {
                  formatBytes(
                    (isRunning
                      ? displayStats.currentSpeed
                      : displayStats.averageSpeed) * 8,
                    "bits"
                  ).unit
                }
              </span>
            </div>
            <Separator orientation="vertical" />
            <div className="flex flex-col items-start space-y-[-5px]">
              <span className="text-sm italic font-medium pb-1 w-[75px]">
                {isRunning ? "Speed" : "Max Speed"}
              </span>
              <span className="text-3xl w-[70px] font-bold text-right">
                {
                  formatBytes(
                    isRunning
                      ? displayStats.currentSpeed
                      : displayStats.maxSpeed,
                    "bytes"
                  ).value
                }
              </span>
              <span className="text-xs italic font-medium w-full text-right">
                {
                  formatBytes(
                    isRunning
                      ? displayStats.currentSpeed
                      : displayStats.maxSpeed,
                    "bytes"
                  ).unit
                }
                /s
              </span>
            </div>
          </div>
          <span className="text-sm font-medium">Misc</span>
          <div className="flex flex-col space-y-2 pt-2">
            <div className="flex items-center space-x-3">
              <SwitchMini
                id="auto-start"
                checked={autoStart}
                onCheckedChange={setAutoStart}
              />
              <Label htmlFor="auto-start" className="font-normal">
                Auto Start
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <SwitchMini
                id="run-in-background"
                checked={runInBackground}
                onCheckedChange={setRunInBackground}
              />
              <Label htmlFor="run-in-background" className="font-normal">
                Run in Background
              </Label>
            </div>
          </div>
        </CardContent>
        <Separator className="flex w-[90%] mx-auto" />
        <CardFooter className="pt-5">
          <Button onClick={toggleTest} disabled={!selectedNode}>
            {isRunning ? "Stop Test" : "Test Speed"}
            <RocketIcon className="h-5 w-5 ml-2" />
          </Button>
        </CardFooter>
      </Card>

      <Card className="mt-10 w-[85%] mb-10">
        <CardHeader>
          <CardTitle className="text-xl underline decoration-wavy decoration-indigo-500">
            InfoPanel
          </CardTitle>
        </CardHeader>
        <Separator className="flex w-[90%] mx-auto" />
        <CardContent>
          <Tabs defaultValue="network">
            <TabsList className="mt-4 mb-1.5">
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="estimates">Estimates</TabsTrigger>
            </TabsList>
            <TabsContent value="network">
              <div className="flex flex-col space-y-4 px-2">
                <div className="flex flex-row space-x-4">
                  <Badge>32ms</Badge>
                  <span className="text-sm">北京 海淀区 移动 宽带</span>
                </div>
                <div className="flex flex-row space-x-4">
                  <Badge>113ms</Badge>
                  <span className="text-sm">中国香港 Misaka Network, Inc</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="estimates">
              <Table>
                <TableCaption>
                  Estimated traffic based on current speed
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time Span</TableHead>
                    <TableHead>Bytes</TableHead>
                    <TableHead>Bits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isRunning
                    ? displayStats.currentSpeed
                    : displayStats.averageSpeed) > 0 &&
                    calculateEstimates(
                      isRunning
                        ? displayStats.currentSpeed
                        : displayStats.averageSpeed
                    )?.map(({ period, bytes, bits }) => (
                      <TableRow key={period}>
                        <TableCell className="font-medium">
                          1 {period.charAt(0).toUpperCase() + period.slice(1)}
                        </TableCell>
                        <TableCell>{bytes}</TableCell>
                        <TableCell>{bits}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
