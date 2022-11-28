import type { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource')
  const [, acct] = resource.match(/^acct:(i|bp)@bennypowers\.dev/) ?? [];
  if (!acct)
    return new Response(null, {status: 404, statusText: 'Not Found'});
  else {
    return context.json({
      "subject": `acct:${acct}@bennypowers.dev`,
      "aliases": [
        `https://social.bennypowers.dev/@${acct}`,
        `https://social.bennypowers.dev/users/${acct}`
      ],
      "links": [
        {
          "rel": "http://webfinger.net/rel/profile-page",
          "type": "text/html",
          "href": `https://social.bennypowers.dev/@${acct}`
        },
        {
          "rel": "self",
          "type": "application/activity+json",
          "href": `https://social.bennypowers.dev/users/${acct}`
        },
        {
          "rel": "http://ostatus.org/schema/1.0/subscribe",
          "template": "https://social.bennypowers.dev/authorize_interaction?uri={uri}"
        }
      ]
    });
  }
};
