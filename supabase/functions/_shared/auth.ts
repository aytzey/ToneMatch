import { createClient } from "jsr:@supabase/supabase-js@2";

type ResolveRequestUserOptions = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  adminClient: ReturnType<typeof createClient>;
};

export async function resolveRequestUser(request: Request, options: ResolveRequestUserOptions) {
  const forwardedAuthHeader = request.headers.get("x-supabase-auth") ?? request.headers.get("Authorization");

  if (forwardedAuthHeader?.startsWith("Bearer ")) {
    const userClient = createClient(options.supabaseUrl, options.supabaseAnonKey, {
      global: { headers: { Authorization: forwardedAuthHeader } },
    });

    const {
      data: { user },
      error,
    } = await userClient.auth.getUser();

    if (!error && user) {
      return user;
    }
  }

  const devSingleUserEmail =
    Deno.env.get("DEV_SINGLE_USER_EMAIL") ?? Deno.env.get("EXPO_PUBLIC_DEV_SINGLE_USER_EMAIL") ?? "";

  if (!devSingleUserEmail) {
    return null;
  }

  const userList = await options.adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (userList.error) {
    return null;
  }

  return (
    userList.data.users.find((candidate) => candidate.email?.toLowerCase() === devSingleUserEmail.toLowerCase()) ?? null
  );
}
