import {
  json,
  LoaderFunction,
  redirect,
  ActionFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUserById } from "~/utils/user.server";
import { Portal } from "~/components/portal";
import { Modal } from "~/components/modal";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { Action } from "@prisma/client/runtime/library";
import { UserCircle } from "~/components/user-circle";
import { SelectBox } from "~/components/select-box";
import { colorMap, emojiMap } from "~/utils/constants";
import { Kudo } from "~/components/kudo";
import { KudoStyle, Color, Emoji } from "@prisma/client";
import { requireUserId } from "~/utils/auth.server";
import { createKudo } from "~/utils/kudo.server";
import { Department } from "@prisma/client";

type User = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    department: Department | null;
    profilePicture: string | null;
  };
};

type ActionData = {
  errors?: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };
  fields?: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };
  error?: string;
};

type LoaderData = {
  recipient: {
    id: string;
    updatedAt: string;
    createdAt: string;
    email: string;
    password: string;
    profile: {
      firstName: string;
      lastName: string;
      department: Department | null;
      profilePicture: string | null;
    };
  };
  user: User;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const { userId } = params;
  if (typeof userId !== "string") {
    return redirect("/home");
  }
  const recipient = await getUserById(userId);
  const user = await getUser(request);
  return json({ recipient, user });
};

// function parseDates(data: LoaderData["recipient"]): User {
//   return {
//     ...data,
//     createdAt: new Date(data.createdAt), // Convert string to Date
//     updatedAt: new Date(data.updatedAt), // Convert string to Date
//   };
// }

export default function KudoModal() {
  const actionData = useLoaderData<ActionData>();
  const [formError] = useState(actionData?.error || "");
  const [formData, setFormData] = useState({
    message: "",
    style: {
      backgroundColor: "RED",
      textColor: "WHITE",
      emoji: "THUMBSUP",
    } as KudoStyle,
  });
  // const { recipient } = useLoaderData<LoaderData>();
  // const user = parseDates(recipient); // Convert date strings to Date objects

  const handleStyleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    setFormData((data) => ({
      ...data,
      style: {
        ...data.style,
        [field]: e.target.value,
      },
    }));
  };

  const getOptions = (data: any) =>
    Object.keys(data).reduce((acc: any[], curr) => {
      acc.push({
        name: curr.charAt(0).toUpperCase() + curr.slice(1).toLowerCase(),
        value: curr,
      });
      return acc;
    }, []);

  const colors = getOptions(colorMap);
  const emojis = getOptions(emojiMap);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    setFormData((data) => ({ ...data, [field]: e.target.value }));
  };

  const { recipient, user } = useLoaderData<LoaderData>();
  return (
    <Modal isOpen={true} className="w-2/3 p-10">
      <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full mb-2">
        {formError}
      </div>
      <form method="POST">
        <input type="hidden" value={recipient.id} name="recipientId" />
        <div className="flex flex-col md:flex-row gap-y-2 md:gap-y-0">
          <div className="text-center flex flex-col items-center gap-y-2 pr-8">
            <UserCircle
              profile={recipient.profile}
              className="h-24 w-24"
            ></UserCircle>
            <p className="text-blue-300">
              {recipient.profile.firstName} {recipient.profile.lastName}
            </p>
            {recipient.profile.department && (
              <span className="px-2 py-1 bg-gray-300 rounded-xl text-blue-300 w-auto">
                {recipient.profile.department[0].toUpperCase() +
                  recipient.profile.department.toLowerCase().slice(1)}
              </span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-y-4">
            <textarea
              name="message"
              className="w-full rounded-xl h-40 p-4"
              value={formData.message}
              onChange={(e) => handleChange(e, "message")}
              placeholder={`Say something nice about ${recipient.profile.firstName}...`}
            />
            <div className="flex flex-col items-center md:flex-row md:justify-start gap-x-4">
              {/* Select Boxes Go Here */}
              <SelectBox
                options={colors}
                name="backgroundColor"
                value={formData.style.backgroundColor}
                onChange={(e) => handleStyleChange(e, "backgroundColor")}
                label="Background Color"
                containerClassName="w-36"
                className="w-full rounded-xl px-3 py-2 text-gray-400"
              ></SelectBox>

              <SelectBox
                options={colors}
                name="textColor"
                value={formData.style.textColor}
                onChange={(e) => handleStyleChange(e, "textColor")}
                label="Text Color"
                containerClassName="w-36"
                className="w-full rounder-xl px-3 py-2 text-gray-400"
              ></SelectBox>

              <SelectBox
                options={emojis}
                label="Emoji"
                name="emoji"
                value={formData.style.emoji}
                onChange={(e) => handleStyleChange(e, "emoji")}
                containerClassName="w-36"
                className="w-full rounded-xl px-3 py-2 text-gray-400"
              ></SelectBox>
            </div>
          </div>
        </div>
        <br />
        <p className="text-blue-600 font-semibold mb-2">Preview</p>
        <div className="flex flex-col items-center md:flex-row gap-x-24 gap-y-2 md:gap-y-0">
          {/* The Preview Goes Here */}
          <Kudo profile={user.profile} kudo={formData}></Kudo>
          <div className="flex-1" />
          <button
            type="submit"
            className="rounded-xl bg-yellow-300 font-semibold text-blue-600 w-80 h-12 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1"
          >
            Send
          </button>
        </div>
      </form>
    </Modal>
  );
}

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  //console.log(form);
  const message = form.get("message");
  const backgroundColor = form.get("backgroundColor");
  const textColor = form.get("textColor");
  const emoji = form.get("emoji");
  const recipientId = form.get("recipientId");

  if (
    typeof message !== "string" ||
    typeof recipientId !== "string" ||
    typeof backgroundColor !== "string" ||
    typeof textColor !== "string"
  )
    return json({ error: `Invalid Form data` }, { status: 400 });
  if (!message.length) {
    return json({ error: `Please provide a message` }, { status: 400 });
  }

  if (!recipientId.length)
    return json({ error: `No recipient found ... ` }, { status: 400 });

  await createKudo(message, userId, recipientId, {
    backgroundColor: backgroundColor as Color,
    textColor: textColor as Color,
    emoji: emoji as Emoji,
  });

  return redirect("/home");
};
