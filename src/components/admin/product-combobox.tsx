"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_PRODUCTS } from "@/lib/mocks/products";

interface Props {
  value: string;
  onChange: (productCode: string) => void;
}

export function ProductCombobox({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Pick a product…" />
      </SelectTrigger>
      <SelectContent>
        {MOCK_PRODUCTS.map((p) => (
          <SelectItem key={p.code} value={p.code}>
            {p.name} ({p.unit})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function findProduct(code: string) {
  return MOCK_PRODUCTS.find((p) => p.code === code);
}
