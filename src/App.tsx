import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
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

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

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
              <Select>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select Node" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="node-1">Node 1</SelectItem>
                  <SelectItem value="node-2">Node 2</SelectItem>
                  <SelectItem value="node-3">Node 3</SelectItem>
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
              <span className="text-sm italic font-medium pb-1">Traffic</span>
              <span className="text-3xl w-[70px] font-bold text-right">
                1.50
              </span>
              <span className="text-xs italic font-medium w-full text-right">
                GiB
              </span>
            </div>
            <Separator orientation="vertical" />
            <div className="flex flex-col items-start space-y-[-5px]">
              <span className="text-sm italic font-medium pb-1">
                Avg. speed
              </span>
              <span className="text-3xl w-[70px] font-bold text-right">
                324
              </span>
              <span className="text-xs italic font-medium w-full text-right">
                Mbps
              </span>
            </div>
            <Separator orientation="vertical" />
            <div className="flex flex-col items-start space-y-[-5px]">
              <span className="text-sm italic font-medium pb-1">Speed</span>
              <span className="text-3xl w-[70px] font-bold text-right">
                530
              </span>
              <span className="text-xs italic font-medium w-full text-right">
                Mpbs
              </span>
            </div>
          </div>
          <span className="text-sm font-medium">Misc</span>
          <div className="flex flex-col space-y-2 pt-2">
            <div className="flex items-center space-x-3">
              <SwitchMini id="auto-start" />
              <Label htmlFor="airplane-mode" className="font-normal">
                Auto Start
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <SwitchMini id="run-on-startup" />
              <Label htmlFor="airplane-mode" className="font-normal">
                Run in Background
              </Label>
            </div>
          </div>
        </CardContent>
        <Separator className="flex w-[90%] mx-auto" />
        <CardFooter className="pt-5">
          <Button onClick={greet}>
            Test Speed
            <RocketIcon className="h-5 w-5 ml-2" />
          </Button>
        </CardFooter>
      </Card>
      <Card className="mt-10 w-[85%]">
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
                  <TableRow>
                    <TableCell className="font-medium">1 Minute</TableCell>
                    <TableCell>1.5 GiB</TableCell>
                    <TableCell>12 Gibits</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">1 Hour</TableCell>
                    <TableCell>90 GiB</TableCell>
                    <TableCell>720 Gibits</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">1 Day</TableCell>
                    <TableCell>2.16 TiB</TableCell>
                    <TableCell>17.28 Gibits</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">1 Week</TableCell>
                    <TableCell>15.12 TiB</TableCell>
                    <TableCell>120.96 Tibits</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">1 Month</TableCell>
                    <TableCell>64.8 TiB</TableCell>
                    <TableCell>518.4 Tibits</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <footer className="text-center text-sm text-gray-500 mt-5">
        <p>Build: 0.1.0(76aac40)</p>
      </footer>
    </main>
  );
}

export default App;
