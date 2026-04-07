import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import '../lib/providers/auth_provider.dart';
import '../lib/services/auth_service.dart';
import '../lib/services/api_service.dart';

// Generates mock AuthService and ApiService classes
@GenerateMocks([AuthService, ApiService])
import 'auth_provider_test.mocks.dart';

void main() {
  late AuthProvider authProvider;
  late MockAuthService mockAuthService;
  late MockApiService mockApiService;

  setUp(() {
    mockAuthService = MockAuthService();
    mockApiService = MockApiService();
  });

  test('Initial state: Loading then Unauthenticated', () async {
    when(mockAuthService.isLoggedIn()).thenAnswer((_) async => false);

    authProvider = AuthProvider(mockAuthService, mockApiService);

    expect(authProvider.isLoading, true);

    // Wait for the async check in constructor
    await Future.delayed(Duration.zero);

    expect(authProvider.isLoading, false);
    expect(authProvider.isAuthenticated, false);
  });

  test('Successful login updates state', () async {
    when(mockAuthService.isLoggedIn()).thenAnswer((_) async => false);
    when(mockAuthService.login('test@test.com', 'password'))
        .thenAnswer((_) async => true);
    when(mockAuthService.getDecodedToken())
        .thenAnswer((_) async => {'sub': 'Test User'});

    authProvider = AuthProvider(mockAuthService, mockApiService);
    await Future.delayed(Duration.zero);

    final success =
        await authProvider.login('test@test.com', 'password');

    expect(success, true);
    expect(authProvider.isAuthenticated, true);
    expect(authProvider.userClaims?['sub'], 'Test User');
  });

  test('Failed login shows error state', () async {
    when(mockAuthService.isLoggedIn()).thenAnswer((_) async => false);
    when(mockAuthService.login('wrong@test.com', 'wrong'))
        .thenAnswer((_) async => false);

    authProvider = AuthProvider(mockAuthService, mockApiService);
    await Future.delayed(Duration.zero);

    final success =
        await authProvider.login('wrong@test.com', 'wrong');

    expect(success, false);
    expect(authProvider.isAuthenticated, false);
  });
}
