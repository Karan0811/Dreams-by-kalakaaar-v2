"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@dbk/ui";
import { CreatorAddressesSection } from "./CreatorAddressesSection";
import { CreatorBankDetailsSection } from "./CreatorBankDetailsSection";
import { CreatorSocialLinksSection } from "./CreatorSocialLinksSection";
import { CreatorDocumentsSection } from "./CreatorDocumentsSection";

export function SettingsTabs() {
  return (
    <Tabs defaultValue="addresses">
      <TabsList>
        <TabsTrigger value="addresses">Addresses</TabsTrigger>
        <TabsTrigger value="bank">Bank Details</TabsTrigger>
        <TabsTrigger value="social">Social Links</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="addresses" className="pt-[var(--space-300)]">
        <CreatorAddressesSection />
      </TabsContent>
      <TabsContent value="bank" className="pt-[var(--space-300)]">
        <CreatorBankDetailsSection />
      </TabsContent>
      <TabsContent value="social" className="pt-[var(--space-300)]">
        <CreatorSocialLinksSection />
      </TabsContent>
      <TabsContent value="documents" className="pt-[var(--space-300)]">
        <CreatorDocumentsSection />
      </TabsContent>
    </Tabs>
  );
}
