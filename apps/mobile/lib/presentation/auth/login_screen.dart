import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_screen.dart';
import 'auth_provider.dart';
import 'login_form_card.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isRegistering = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              cs.surface,
              cs.primary.withValues(alpha: 0.08),
              cs.surface,
            ],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              Positioned(
                top: 4,
                right: 4,
                child: IconButton(
                  icon: Icon(
                    Icons.settings_rounded,
                    color: cs.onSurface.withValues(alpha: 0.6),
                  ),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const SettingsScreen(),
                    ),
                  ),
                ),
              ),
              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 24),
                      _buildBrandHeader(cs, tt),
                      const SizedBox(height: 36),
                      LoginFormCard(
                        auth: auth,
                        emailController: _emailController,
                        passwordController: _passwordController,
                        isRegistering: _isRegistering,
                        onToggle: () {
                          auth.clearError();
                          setState(
                            () => _isRegistering = !_isRegistering,
                          );
                        },
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBrandHeader(ColorScheme cs, TextTheme tt) {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [cs.primary, cs.primary.withValues(alpha: 0.6)],
            ),
          ),
          child: Icon(Icons.bolt_rounded, size: 44, color: cs.onPrimary),
        ),
        const SizedBox(height: 16),
        Text(
          'FLUX',
          style: tt.headlineLarge?.copyWith(letterSpacing: 4),
        ),
        const SizedBox(height: 4),
        Text(
          'Privacy-First Intelligent Learning',
          style: tt.bodySmall?.copyWith(fontStyle: FontStyle.italic),
        ),
      ],
    );
  }
}
