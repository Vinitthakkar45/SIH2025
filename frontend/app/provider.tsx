"use client";

import { HeroUIProvider } from "@heroui/react";

export default function HeroUiClientProvider({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <HeroUIProvider>
		<main className="dark">
			{children}
		</main>
	</HeroUIProvider>;
}
