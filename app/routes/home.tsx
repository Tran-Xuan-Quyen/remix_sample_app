import { LoaderFunction, json } from "@remix-run/node";
import { requireUserId, getUser } from "~/utils/auth.server";
import { UserPanel } from "~/components/user-panel";
import { Layout } from "~/components/layout";
import { getOtherUsers } from "~/utils/user.server";
import { useLoaderData, Outlet } from "@remix-run/react";
import { getFilteredKudos, getRecentKudos } from "~/utils/kudo.server";
import { Kudo } from "~/components/kudo";
import { Kudo as IKudo, Profile, Prisma } from "@prisma/client";
import { SearchBar } from "~/components/search-bar";
import { RecentBar } from "~/components/recent-bar";
import type { Department } from "@prisma/client"

interface KudoWithProfile extends IKudo {
  author: {
    profile: Profile;
  };
}

interface KudoWithRecipient extends IKudo {
  recipient: User;
}

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
type LoaderData = {
  users: User[];
  kudos: (Omit<KudoWithProfile, "createdAt"> & { createdAt: string })[];
  recentKudos: Omit<KudoWithRecipient, "createdAt"> & { createdAt: string };
  user: any;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const users = await getOtherUsers(userId);
  const recentKudos = await getRecentKudos();
  const user = await getUser(request);

  const url = new URL(request.url);
  const sort = url.searchParams.get("sort");
  const filter = url.searchParams.get("filter");

  let sortOptions: Prisma.KudoOrderByWithRelationInput = {};
  if (sort) {
    if (sort === "date") {
      sortOptions = { createdAt: "desc" };
    }
    if (sort === "sender") {
      sortOptions = { author: { profile: { firstName: "asc" } } };
    }
    if (sort === "emoji") {
      sortOptions = { style: { emoji: "asc" } };
    }
  }

  let textFilter: Prisma.KudoWhereInput = {};
  if (filter) {
    textFilter = {
      OR: [
        { message: { mode: "insensitive", contains: filter } },
        {
          author: {
            OR: [
              {
                profile: {
                  is: { firstName: { mode: "insensitive", contains: filter } },
                },
              },
              {
                profile: {
                  is: { lastName: { mode: "insensitive", contains: filter } },
                },
              },
            ],
          },
        },
      ],
    };
  }
  const kudos = await getFilteredKudos(userId, sortOptions, textFilter);
  return json({ users, kudos, recentKudos, user });
};

function parseDates(users: any[]): User[] {
  return users.map((user) => ({
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  }));
}

export default function Home() {
  const {
    users: jsonUsers,
    kudos: jsonKudos,
    recentKudos,
    user,
  } = useLoaderData<LoaderData>();
  const users = parseDates(jsonUsers);
  const kudos = jsonKudos.map((kudo) => ({
    ...kudo,
    createdAt: new Date(kudo.createdAt),
  }));
  return (
    <Layout>
      <Outlet />
      <div className="h-full flex">
        <UserPanel users={users} />
        <div className="flex-1 flex flex-col p-4">
          <SearchBar profile={user.profile} />
          <div className="flex-1 flex">
            <div className="w-full p-10 flex flex-col gap-y-4">
              {kudos.map((kudo: KudoWithProfile) => (
                <Kudo
                  key={kudo.id}
                  kudo={kudo}
                  profile={kudo.author.profile}
                ></Kudo>
              ))}
            </div>
            <RecentBar kudos={recentKudos} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
