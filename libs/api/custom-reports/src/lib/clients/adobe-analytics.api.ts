import { readFile } from 'node:fs/promises';
import { init, type AnalyticsCoreAPI } from '@adobe/aio-lib-analytics';
import { sign } from 'jsonwebtoken';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import type { AuthParams } from '@dua-upd/types-common';

export const defaultAuthParams: Partial<AuthParams> = {
  clientId: process.env['AW_CLIENT_ID'],
  clientSecret: process.env['AW_CLIENT_SECRET'],
  organizationId: process.env['AW_ORGANIZATION_ID'],
  technicalId: process.env['AW_TECHNICAL_ID'],
  companyId: process.env['AW_COMPANY_ID'],
};

export function getAuthToken(params: AuthParams) {
  const jwtPayload = {
    exp: params.expiryDateTime,
    iss: params.organizationId,
    sub: params.technicalId,
    'https://ims-na1.adobelogin.com/s/ent_analytics_bulk_ingest_sdk': true,
    aud: `https://ims-na1.adobelogin.com/c/${params.clientId}`,
  };

  try {
    const jwt = sign(jwtPayload, params.privateKey, { algorithm: 'RS256' });

    return axios
      .post(
        'https://ims-na1.adobelogin.com/ims/exchange/jwt',
        `client_id=${params.clientId}&client_secret=${params.clientSecret}&jwt_token=${jwt}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      )
      .then(
        (response: { data: { access_token: string } }) =>
          response.data.access_token,
      );
  } catch (e) {
    console.error('Error getting Adobe Analytics JSON Web Token:');

    if (e instanceof AxiosError) {
      console.log(e.response?.data);
      console.log(e.response?.status);
      console.log(e.response?.headers);
    } else {
      console.log((<Error>e).stack);
    }

    throw e;
  }
}

export async function getAAClient(
  authParams: AuthParams,
): Promise<AnalyticsCoreAPI> {
  if (!authParams.expiryDateTime) {
    authParams.expiryDateTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  }

  const token = await getAuthToken(authParams);

  const formattedExpiryDateTime = dayjs(
    authParams.expiryDateTime * 1000,
  ).format('YYYY-MM-DD HH:mm:ss');

  console.log(
    `New AA client token successfully created.\r\nValid until: ${formattedExpiryDateTime}`,
  );

  return await init(authParams.companyId, authParams.clientId, token);
}

export const getDefaultAuthParams = async () =>
  ({
    ...defaultAuthParams,
    privateKey: await readFile(
      process.env['AA_KEY_PATH'] || 'keys/secret.pem',
      'utf8',
    ),
  }) as AuthParams;

export const getDefaultAAClient = () =>
  getDefaultAuthParams().then(getAAClient);
