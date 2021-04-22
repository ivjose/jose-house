import React, { ChangeEvent } from "react";
import { FunctionComponent } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useGoogleMapsScript, Libraries } from "use-google-maps-script";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";

interface ISearchBoxProps {
  onSelectAddress(
    address: string,
    label: number | null,
    longitude: number | null
  ): void;
  defaultValue: string;
}

const libraries: Libraries = ["places"];

export function SearchBox({ onSelectAddress, defaultValue }: ISearchBoxProps) {
  const { isLoaded, loadError } = useGoogleMapsScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    libraries,
  });

  if (!isLoaded) return null;
  if (loadError) return <div>Error Loading</div>;

  return (
    <ReadySearchBox
      onSelectAddress={onSelectAddress}
      defaultValue={defaultValue}
    />
  );
}

function ReadySearchBox({ onSelectAddress, defaultValue }: ISearchBoxProps) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 1000,
    defaultValue,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (e.target.value === "") {
      onSelectAddress("", null, null);
    }
  };

  const handleSelect = async (address: string) => {
    console.log({ address });
    setValue(address, false);
    clearSuggestions();

    try {
      const result = await getGeocode({ address });
      const { lat, lng } = await getLatLng(result[0]);
      onSelectAddress(address, lat, lng);
    } catch (error) {
      console.error("ERRRso", error);
    }
  };

  console.log({ status, data });

  return (
    <Combobox onSelect={handleSelect}>
      <ComboboxInput
        id="search"
        value={value}
        onChange={handleChange}
        disabled={!ready}
        placeholder="Search your location"
        className="w-full p-2"
        autoComplete={false}
      />
      <ComboboxPopover>
        <ComboboxList>
          {status === "OK" &&
            data.map(({ place_id, description }) => (
              <ComboboxOption key={place_id} value={description} />
            ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  );
}
