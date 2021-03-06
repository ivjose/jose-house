import { useState, useEffect, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useMutation, gql } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import { Image } from "cloudinary-react";
import { SearchBox } from "./searchBox";
import {
  CreateHouseMutation,
  CreateHouseMutationVariables,
} from "src/generated/CreateHouseMutation";
import {
  UpdateHouseMutation,
  UpdateHouseMutationVariables,
} from "src/generated/UpdateHouseMutation";
import { CreateSignatureMutation } from "src/generated/CreateSignatureMutation";
import { route } from "next/dist/next-server/server/router";

const SIGNATURE_MUTATION = gql`
  mutation CreateSignatureMutation {
    createImageSignature {
      signature
      timestamp
    }
  }
`;

const CREATE_HOUSE_MUTATION = gql`
  mutation CreateHouseMutation($input: HouseInput!) {
    createHouse(input: $input) {
      id
    }
  }
`;

const UPDATE_HOUSE_MUTATION = gql`
  mutation UpdateHouseMutation($id: String!, $input: HouseInput!) {
    updateHouse(id: $id, input: $input) {
      id
      image
      publicId
      latitude
      longitude
      bedrooms
      address
    }
  }
`;

interface IUploadImageResponse {
  secure_url: string;
}

async function uploadImage(
  image: File,
  signature: string,
  timestamp: number
): Promise<IUploadImageResponse> {
  const url = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;

  const formData = new FormData();
  formData.append("file", image);
  formData.append("signature", signature);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_KEY ?? "");

  const response = await fetch(url, {
    method: "post",
    body: formData,
  });
  return response.json();
}

interface IFromData {
  address: string;
  latitude: number;
  longitude: number;
  bedrooms: string;
  image: FileList;
}

interface IHouse {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  image: string;
  publicId: string;
}

interface IProps {
  house?: IHouse;
}

export default function HouseForm({ house }: IProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setpreviewImage] = useState<string>("");
  const { register, handleSubmit, setValue, errors, watch } = useForm<
    IFromData
  >({
    defaultValues: house
      ? {
          address: house.address,
          latitude: house.latitude,
          longitude: house.longitude,
          bedrooms: house.bedrooms.toString(),
        }
      : {},
  });

  const address = watch("address");
  const [createSignature] = useMutation<CreateSignatureMutation>(
    SIGNATURE_MUTATION
  );
  const [createHouse] = useMutation<
    CreateHouseMutation,
    CreateHouseMutationVariables
  >(CREATE_HOUSE_MUTATION);
  const [updateHouse] = useMutation<
    UpdateHouseMutation,
    UpdateHouseMutationVariables
  >(UPDATE_HOUSE_MUTATION);

  useEffect(() => {
    register({ name: "address" }, { required: "Please enter you address" });
    register({ name: "latitude" }, { required: true, min: -90, max: 90 });
    register({ name: "longitude" }, { required: true, min: -180, max: 180 });
  }, [register]);

  const handleCreate = async (data: IFromData) => {
    const { data: signatureData } = await createSignature();
    if (signatureData) {
      const { signature, timestamp } = signatureData.createImageSignature;
      const imageData = await uploadImage(data.image[0], signature, timestamp);

      const { data: housedata } = await createHouse({
        variables: {
          input: {
            address: data.address,
            image: imageData.secure_url,
            coordinates: { latitude: data.latitude, longitude: data.longitude },
            bedrooms: parseInt(data.bedrooms, 10),
          },
        },
      });

      if (housedata?.createHouse) {
        return router.push(`/houses/${housedata.createHouse.id}`);
      }
      return alert("ERROR!");
    }
  };

  const handleUpdate = async (currentHouse: IHouse, data: IFromData) => {
    let image = currentHouse.image;

    if (data.image[0]) {
      const { data: signatureData } = await createSignature();
      if (signatureData) {
        const { signature, timestamp } = signatureData.createImageSignature;
        const imageData = await uploadImage(
          data.image[0],
          signature,
          timestamp
        );
        image = imageData.secure_url;
      }
    }

    const { data: houseData } = await updateHouse({
      variables: {
        id: currentHouse.id,
        input: {
          address: data.address,
          image: image,
          coordinates: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
          bedrooms: parseInt(data.bedrooms, 10),
        },
      },
    });

    if (houseData?.updateHouse) {
      router.push(`/houses/${currentHouse.id}`);
    }
  };

  const onSubmit = (data: IFromData) => {
    setSubmitting(true);
    if (!!house) {
      handleUpdate(house, data);
    } else {
      handleCreate(data);
    }
  };

  console.log(errors);

  return (
    <form
      className="max-w-xl py-4 mx-auto max-auto"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h1 className="text-xl">
        {house ? `Editing ${house.address}` : "Add a New House"}
      </h1>

      <div className="mt-4">
        <label htmlFor="search" className="block">
          Search for your address
        </label>
        <SearchBox
          onSelectAddress={(address, latitude, longitude) => {
            setValue("address", address);
            setValue("latitude", latitude);
            setValue("longitude", longitude);
          }}
          defaultValue={house ? house.address : ""}
        />
        {errors.address && (
          <p className="text-red-500">{errors.address.message}</p>
        )}
      </div>
      {address && (
        <>
          <div className="mt-4">
            <label
              htmlFor="image"
              className="block p-4 border-4 border-gray-600 border-dashed cursor-pointer"
            >
              Click to add Image (16:9)
            </label>
            <input
              type="file"
              id="image"
              name="image"
              accept="images/*"
              hidden
              ref={register({
                validate: (fileList: FileList) => {
                  if (house || fileList.length === 1) return true;
                  return "Please Upload one file";
                },
              })}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                if (event?.target?.files?.[0]) {
                  const file = event.target.files[0];
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setpreviewImage(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />

            {previewImage ? (
              <img
                src={previewImage}
                className="object-cover mt-4"
                style={{ width: 576, height: `${(9 / 16) * 576}px` }}
              />
            ) : house ? (
              <Image
                className="pb-2"
                cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
                publicId={house.publicId}
                alt={house.address}
                secure
                dpr="auto"
                quality="auto"
                width={575}
                height={Math.floor((9 / 16) * 575)}
                crop="fill"
                gravity="auto"
              />
            ) : null}

            {errors.image && (
              <p className="text-red-500">{errors.image.message}</p>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="bedrooms" className="block">
              Beds
            </label>
            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              className="p-2"
              ref={register({
                required: "Please enter number of bedrooms",
                max: { value: 10, message: "Woooah, to big of a house" },
                min: { value: 1, message: "Must have at least 1 bedroom" },
              })}
            />

            {errors.bedrooms && (
              <p className="text-red-500">{errors.bedrooms.message}</p>
            )}
          </div>

          <div className="mt-4">
            <button
              className="px-4 py-2 mr-2 bg-blue-500 rounded hover:bg-blue-700 font-blue"
              type="submit"
              disabled={submitting}
            >
              Save
            </button>{" "}
            <Link href={house ? `/houses/${house.id}` : "/"}>
              <a>Cancel</a>
            </Link>
          </div>
        </>
      )}
    </form>
  );
}
