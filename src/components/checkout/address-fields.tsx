"use client";

import type { ShippingData } from "@/types/account";
import { SelectField, TextField } from "@/components/ui/field";
import { departments, guatemala } from "@/lib/guatemala";

type Errors = Partial<Record<keyof ShippingData, string>>;
type Props = { value: ShippingData; onChange: (patch: Partial<ShippingData>) => void; errors: Errors; idPrefix: string };

/** Dirección de entrega en Guatemala: departamento → municipio, zona y dirección exacta. */
export function AddressFields({ value, onChange, errors, idPrefix }: Props) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        id={id("department")}
        name="department"
        label="Departamento"
        placeholder="Elige un departamento"
        options={departments}
        value={value.department}
        onChange={(e) => onChange({ department: e.target.value, municipality: "" })}
        error={errors.department}
        autoComplete="address-level1"
      />
      <SelectField
        id={id("municipality")}
        name="municipality"
        label="Municipio"
        placeholder={value.department ? "Elige un municipio" : "Primero elige el departamento"}
        options={guatemala[value.department] ?? []}
        value={value.municipality}
        onChange={(e) => onChange({ municipality: e.target.value })}
        error={errors.municipality}
        disabled={!value.department}
        autoComplete="address-level2"
      />
      <div className="sm:col-span-2">
        <TextField id={id("zone")} name="zone" label="Zona, barrio o colonia" value={value.zone} onChange={(e) => onChange({ zone: e.target.value })} error={errors.zone} maxLength={120} />
      </div>
      <div className="sm:col-span-2">
        <TextField
          id={id("street")}
          name="street"
          label="Dirección exacta"
          hint="Calle, número de casa y lugar de residencia."
          value={value.street}
          onChange={(e) => onChange({ street: e.target.value })}
          error={errors.street}
          autoComplete="street-address"
          maxLength={200}
        />
      </div>
      <div className="sm:col-span-2">
        <TextField
          id={id("references")}
          name="references"
          label="Referencias"
          optional
          placeholder="Ej. casa azul frente al parque"
          value={value.references ?? ""}
          onChange={(e) => onChange({ references: e.target.value })}
          maxLength={200}
        />
      </div>
    </div>
  );
}
