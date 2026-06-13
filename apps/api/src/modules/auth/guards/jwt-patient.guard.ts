import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtPatientGuard extends AuthGuard('jwt-patient') {}
