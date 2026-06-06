import 'package:flutter/material.dart';
import 'auth_provider.dart';

/// Glassmorphic form card with email, password, error banner, and toggle.
class LoginFormCard extends StatelessWidget {
  const LoginFormCard({
    super.key,
    required this.auth,
    required this.emailController,
    required this.passwordController,
    required this.isRegistering,
    required this.onToggle,
  });

  final AuthProvider auth;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool isRegistering;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Card(
      color: cs.surface.withValues(alpha: 0.85),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildErrorBanner(cs, tt),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email Address',
                prefixIcon: Icon(Icons.email_outlined),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password',
                prefixIcon: Icon(Icons.lock_outline_rounded),
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: auth.isLoading
                    ? null
                    : () {
                        final email = emailController.text.trim();
                        final pw = passwordController.text;
                        if (email.isNotEmpty && pw.isNotEmpty) {
                          if (isRegistering) {
                            auth.register(email, pw);
                          } else {
                            auth.login(email, pw);
                          }
                        }
                      },
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Text(
                    auth.isLoading
                        ? 'Connecting...'
                        : (isRegistering ? 'Create Account' : 'Log In'),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: onToggle,
              child: Text(isRegistering
                  ? 'Already have an account? Sign In'
                  : 'Need an account? Sign Up'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorBanner(ColorScheme cs, TextTheme tt) {
    return AnimatedSize(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
      child: auth.error != null
          ? Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: cs.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: cs.error.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline_rounded,
                      size: 20, color: cs.error),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      auth.error!,
                      style: tt.bodySmall?.copyWith(color: cs.error),
                    ),
                  ),
                ],
              ),
            )
          : const SizedBox.shrink(),
    );
  }
}
