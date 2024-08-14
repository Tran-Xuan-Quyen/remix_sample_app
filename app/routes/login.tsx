import { Layout } from "~/components/layout";
import { useState, useRef, useEffect } from "react";
import { FormField } from "~/components/form-field";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "~/utils/validators.server";
import { login, register, getUser } from "~/utils/auth.server";
import { useActionData } from "@remix-run/react";

export const loader: LoaderFunction = async ({ request }) => {
  return (await getUser(request)) ? redirect("/") : null;
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

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const action = form.get("_action");
  const email = form.get("email");
  const password = form.get("password");
  let firstName = form.get("firstName");
  let lastName = form.get("lastName");
  if (
    typeof action !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  )
    return json({ error: `Invalid Form Data`, form: action }, { status: 400 });
  if (
    action === "register" &&
    (typeof firstName !== "string" || typeof lastName !== "string")
  )
    return json({ error: `Invalid Form Data`, form: action }, { status: 400 });

  const errors = {
    email: validateEmail(email),
    password: validatePassword(password),
    ...(action === "register"
      ? {
          firstName: validateName((firstName as string) || ""),
          lastName: validateName((lastName as string) || ""),
        }
      : {}),
  };

  if (Object.values(errors).some(Boolean)) {
    console.log(errors);
    return json(
      {
        errors,
        fields: { email, password, firstName, lastName },
        form: action,
      },
      {}
    );
  }

  switch (action) {
    case "login": {
      return await login({ email, password });
    }
    case "register": {
      firstName = firstName as string;
      lastName = lastName as string;
      return await register({ email, password, firstName, lastName });
    }
    default:
      return json({ error: `Invalid Form Data` }, { status: 404 });
  }
};

export default function Login() {
  const [action, setAction] = useState("login");

  const actionData = useActionData<ActionData>();

  const firstLoad = useRef(true);
  const [errors, setErrors] = useState(actionData?.errors || {});
  const [formError, setFormError] = useState(actionData?.error || "");

  const [formData, setFormData] = useState({
    email: actionData?.fields?.email || "",
    password: actionData?.fields?.password || "",
    firstName: actionData?.fields?.firstName || "",
    lastName: actionData?.fields?.lastName || "",
  });

  useEffect(() => {
    if (!firstLoad.current) {
      const newState = {
        email: "",
        password: "",
        firstName: "",
        lastName: "",
      };
      setErrors(newState);
      setFormError("");
      setFormData(newState);
    }
  }, [action]);

  useEffect(() => {
    if (!firstLoad.current) {
      setFormError("");
    }
  }, [formData]);

  useEffect(() => {
    firstLoad.current = true;
  }, []);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    setFormData((form) => ({
      ...form,
      [field]: event.target.value,
    }));
  };

  return (
    <Layout>
      <div className="h-full justify-center items-center flex flex-col gap-y-4">
        <button
          onClick={() => setAction(action == "login" ? "register" : "login")}
          className="absolute top-8 right-8 rounded-xl bg-yellow-300 font-semibold text-blue-600 px-3 py-2 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1"
        >
          {action === "login" ? "Sign Up" : "Sign In"}
        </button>
        <h2 className="text-5xl font-extrabold text-yellow-300">
          Welcome to Kudos!
        </h2>
        <p className="font-semibold text-slate-300">
          {action === "login"
            ? "Log in to Give som praise"
            : "Sign up to get Started!"}
        </p>

        <form method="post" className="rounded-2xl bg-gray-200 p-6 w-96">
          <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full">
            {formError}
          </div>
          <FormField
            htmlFor="email"
            label="Email"
            value={formData.email}
            onChange={(e) => handleInputChange(e, "email")}
            error={errors?.email}
          ></FormField>
          <FormField
            htmlFor="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange(e, "password")}
            error={errors?.password}
          ></FormField>
          <div className="w-full text-center">
            <button
              type="submit"
              className="rounded-xl mt-2 bg-yellow-300 px-3 py-2 text-blue-600 font-semibold transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1"
              value={action}
              name="_action"
            >
              {action === "login" ? "Sign In" : "Sign Up"}
            </button>
          </div>
          {action === "register" && (
            <>
              <FormField
                htmlFor="firstName"
                label="First Name"
                onChange={(e) => handleInputChange(e, "firstName")}
                value={formData.firstName}
                error={errors.firstName}
              ></FormField>
              <FormField
                htmlFor="lastName"
                label="Last Name"
                onChange={(e) => handleInputChange(e, "lastName")}
                value={formData.lastName}
                error={errors.lastName}
              ></FormField>
            </>
          )}
        </form>
      </div>
    </Layout>
  );
}
