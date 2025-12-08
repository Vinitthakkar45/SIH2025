"use client";

import {
  AnalyticsUpIcon,
  Chart01Icon,
  DropletIcon,
  Location01Icon,
} from "@/components/icons";
import { Card, CardBody } from "@heroui/react";
import { motion } from "framer-motion";

interface WelcomeViewProps {
  onQueryClick: (query: string) => void;
  userLocation: {
    state: string;
    district: string;
  };
}

export default function WelcomeView({
  onQueryClick,
  userLocation,
}: WelcomeViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-20 pb-8 px-4"
    >
      {/* Greeting */}
      <div className="text-center mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-semibold text-zinc-100 mb-2"
        >
          Hi, Welcome!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-400 text-base"
        >
          How can I assist you today?
        </motion.p>
      </div>
      {/* Action Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto mb-6 auto-rows-fr">
        {[
          {
            icon: <Location01Icon width={22} height={22} />,
            title: "Regional Analysis",
            description: `Get groundwater status for ${userLocation.state}`,
            query: `What is the groundwater status in ${userLocation.state}?`,
          },
          {
            icon: <AnalyticsUpIcon width={22} height={22} />,
            title: "Historical Trends",
            description: `View trends for ${userLocation.district}`,
            query: `Show historical trend for ${userLocation.district}`,
          },
          {
            icon: <DropletIcon width={22} height={22} />,
            title: "Extraction Analysis",
            description: `Analyze extraction changes in ${userLocation.state}`,
            query: `How has groundwater extraction changed in ${userLocation.state} over the years?`,
          },
          {
            icon: <Chart01Icon width={22} height={22} />,
            title: "State Comparison",
            description: "Compare data across multiple states",
            query: "Compare groundwater levels across different states",
          },
        ].map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="w-full"
          >
            <ActionCard
              icon={card.icon}
              title={card.title}
              description={card.description}
              onClick={() => onQueryClick(card.query)}
            />
          </motion.div>
        ))}
      </motion.div>{" "}
    </motion.div>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function ActionCard({ icon, title, description, onClick }: ActionCardProps) {
  return (
    <Card
      isPressable
      onPress={onClick}
      className="bg-linear-to-br from-zinc-900/50 to-zinc-900/30 hover:bg-linear-to-br hover:from-zinc-900/70 hover:to-zinc-900/50 transition-all h-full w-full"
      radius="lg"
    >
      <CardBody className="p-6 flex flex-col h-full">
        <div className="w-11 h-11 rounded-xl bg-linear-to-br from-white/10 to-white/5 flex items-center justify-center mb-4 ">
          <div className="text-zinc-300">{icon}</div>
        </div>
        <h3 className="font-semibold text-zinc-100 mb-2 text-[15px] tracking-tight">
          {title}
        </h3>
        <p className="text-[13px] text-zinc-500 leading-relaxed">
          {description}
        </p>
      </CardBody>
    </Card>
  );
}
